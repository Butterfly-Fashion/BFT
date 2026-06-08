import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";
import { sendTrackingEmail } from "@/lib/email";

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
    .select("id, order_number, shippo_label_url, customer_email, customer_name, total")
    .eq("id", id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // 이미 라벨 있으면 덮어쓰지 않음
  if (order.shippo_label_url) {
    return NextResponse.json(
      { error: "This order already has a label. Remove it first if you want to replace it." },
      { status: 409 }
    );
  }

  // 이 라벨이 다른 주문에 이미 연결됐는지 확인
  const { data: duplicate } = await supabase
    .from("orders")
    .select("order_number")
    .neq("id", id)
    .eq("tracking_number", trackingNumber)
    .maybeSingle();

  if (duplicate) {
    return NextResponse.json(
      { error: `Tracking number already linked to order ${duplicate.order_number}` },
      { status: 409 }
    );
  }

  type ShippoTx = {
    object_id: string;
    status: string;
    label_url: string;
    tracking_number: string;
    tracking_url_provider: string;
    rate: string;
  };

  // Shippo transaction objects don't include a `provider` field — the carrier
  // name lives on the referenced rate object, so it must be fetched separately.
  async function fetchRateProvider(rateId: string): Promise<string> {
    const res = await fetch(`https://api.goshippo.com/rates/${rateId}`, {
      headers: { Authorization: `ShippoToken ${apiKey}` },
    });
    if (!res.ok) return "";
    const rate = await res.json();
    return rate.provider ?? "";
  }

  let matchedTx: ShippoTx | undefined;
  let page = 1;

  while (!matchedTx && page <= 10) {
    const res = await fetch(
      `https://api.goshippo.com/transactions/?results=50&page=${page}`,
      { headers: { Authorization: `ShippoToken ${apiKey}` } }
    );
    if (!res.ok) break;
    const data = await res.json();
    const results: ShippoTx[] = data.results ?? [];
    matchedTx = results.find(
      (t) => t.tracking_number === trackingNumber && t.label_url
    );
    if (!data.next) break;
    page++;
  }

  if (!matchedTx) {
    return NextResponse.json(
      { error: `Tracking number ${trackingNumber} not found in Shippo. Check Shippo dashboard → Shipments → Download the label manually.` },
      { status: 404 }
    );
  }

  const carrier = await fetchRateProvider(matchedTx.rate);

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      shippo_label_url: matchedTx.label_url,
      tracking_number: matchedTx.tracking_number,
      tracking_url: matchedTx.tracking_url_provider || null,
      carrier: carrier || null,
      status: "packing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Found label but failed to save to DB" }, { status: 500 });
  }

  console.log(`[link-label] Linked label for order ${order.order_number} — tracking: ${trackingNumber}`);

  // Register tracking with Shippo so webhooks fire for manually linked labels
  const CARRIER_CODES: Record<string, string> = {
    "canada post": "canada_post",
    "ups": "ups",
    "fedex": "fedex",
    "dhl": "dhl_express",
    "purolator": "purolator",
    "usps": "usps",
  };
  const carrierCode = CARRIER_CODES[carrier.toLowerCase()] ?? "canada_post";
  fetch("https://api.goshippo.com/tracks/", {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ carrier: carrierCode, tracking_number: trackingNumber }),
  }).catch((err) => console.error("[link-label] Shippo tracking register error:", err));

  if (order.customer_email) {
    (async () => {
      const { data: items } = await supabase
        .from("order_items")
        .select("name, quantity, unit_price")
        .eq("order_id", id);
      await sendTrackingEmail({
        orderNumber: order.order_number,
        customerEmail: order.customer_email!,
        customerName: order.customer_name ?? null,
        carrier,
        trackingNumber: matchedTx!.tracking_number,
        trackingUrl: matchedTx!.tracking_url_provider || null,
        items: (items ?? []).map((i: { name: string; quantity: number; unit_price: number }) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unit_price,
        })),
        total: order.total ?? 0,
      });
    })().catch((err) => console.error("[link-label] Tracking email error:", err));
  }

  return NextResponse.json({
    linked: true,
    label_url: matchedTx.label_url,
    tracking_number: matchedTx.tracking_number,
    tracking_url: matchedTx.tracking_url_provider,
    carrier,
  });
}
