import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.SHIPPO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "SHIPPO_API_KEY not configured" }, { status: 500 });
  }

  const { id } = await params;
  const supabase = supabaseAdmin();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, order_number, shippo_rate_id, shippo_label_url, delivery_method, customer_name, shipping_address")
    .eq("id", id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.delivery_method === "pickup") {
    return NextResponse.json({ error: "Pickup orders do not need a shipping label" }, { status: 400 });
  }

  if (!order.shippo_rate_id) {
    return NextResponse.json({
      error: "No Shippo rate ID on this order. The customer may have checked out before rate tracking was enabled.",
    }, { status: 400 });
  }

  if (order.shippo_label_url) {
    return NextResponse.json({
      error: "Label already created for this order.",
      label_url: order.shippo_label_url,
    }, { status: 409 });
  }

  // Purchase the label from Shippo using the rate ID the customer selected
  let shippoRes: Response;
  try {
    shippoRes = await fetch("https://api.goshippo.com/transactions/", {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rate: order.shippo_rate_id,
        label_file_type: "PDF",
        async: false,
      }),
    });
  } catch (err) {
    console.error("[create-label] Shippo network error:", err);
    return NextResponse.json({ error: "Failed to reach Shippo API" }, { status: 502 });
  }

  const transaction = await shippoRes.json();

  if (!shippoRes.ok || transaction.object_status !== "SUCCESS") {
    console.error("[create-label] Shippo error:", JSON.stringify(transaction));
    const msg =
      transaction.messages?.[0]?.text ??
      transaction.object_status ??
      "Shippo returned an error";
    return NextResponse.json({ error: `Shippo: ${msg}`, detail: transaction }, { status: 400 });
  }

  const labelUrl: string = transaction.label_url;
  const trackingNumber: string = transaction.tracking_number ?? "";
  const trackingUrl: string = transaction.tracking_url_provider ?? "";
  const carrier: string = transaction.provider ?? "";

  // Save label URL + tracking to order, advance status to packing
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      shippo_label_url: labelUrl,
      tracking_number: trackingNumber || null,
      tracking_url: trackingUrl || null,
      carrier: carrier || null,
      status: "packing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    console.error("[create-label] Supabase update error:", updateError);
    return NextResponse.json({ error: "Label created but failed to save to DB" }, { status: 500 });
  }

  console.log(`[create-label] Label created for order ${order.order_number} — tracking: ${trackingNumber}`);

  return NextResponse.json({
    label_url: labelUrl,
    tracking_number: trackingNumber,
    tracking_url: trackingUrl,
    carrier,
  });
}
