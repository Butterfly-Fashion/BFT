import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";

export async function POST(
  req: NextRequest,
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
  const body = await req.json().catch(() => ({}));
  const trackingNumber: string = (body.tracking_number ?? "").trim();

  if (!trackingNumber) {
    return NextResponse.json({ error: "tracking_number required" }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, order_number, shippo_label_url")
    .eq("id", id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Shippo 최근 트랜잭션에서 tracking number 매칭
  type ShippoTx = {
    object_id: string;
    object_status: string;
    label_url: string;
    tracking_number: string;
    tracking_url_provider: string;
    provider: string;
  };

  let matchedTx: ShippoTx | undefined;
  let page = 1;

  while (!matchedTx && page <= 3) {
    const res = await fetch(
      `https://api.goshippo.com/transactions/?results=50&page=${page}`,
      { headers: { Authorization: `ShippoToken ${apiKey}` } }
    );
    if (!res.ok) break;
    const data = await res.json();
    const results: ShippoTx[] = data.results ?? [];
    matchedTx = results.find(
      (t) =>
        t.tracking_number === trackingNumber &&
        t.object_status === "SUCCESS" &&
        t.label_url
    );
    if (!data.next) break;
    page++;
  }

  if (!matchedTx) {
    return NextResponse.json(
      { error: `No Shippo transaction found with tracking number ${trackingNumber}` },
      { status: 404 }
    );
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      shippo_label_url: matchedTx.label_url,
      tracking_number: matchedTx.tracking_number,
      tracking_url: matchedTx.tracking_url_provider || null,
      carrier: matchedTx.provider || null,
      status: "packing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Found label but failed to save to DB" }, { status: 500 });
  }

  console.log(`[link-label] Linked label for order ${order.order_number} — tracking: ${trackingNumber}`);

  return NextResponse.json({
    linked: true,
    label_url: matchedTx.label_url,
    tracking_number: matchedTx.tracking_number,
    tracking_url: matchedTx.tracking_url_provider,
    carrier: matchedTx.provider,
  });
}
