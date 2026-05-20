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
    .select("id, order_number, shippo_rate_id, shippo_label_url")
    .eq("id", id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.shippo_label_url) {
    return NextResponse.json(
      { error: "Label already saved", label_url: order.shippo_label_url },
      { status: 409 }
    );
  }

  if (!order.shippo_rate_id) {
    return NextResponse.json(
      { error: "No rate ID on this order. Use 'Link Label' with the tracking number instead." },
      { status: 400 }
    );
  }

  type ShippoTx = {
    object_id: string;
    object_status: string;
    label_url: string;
    tracking_number: string;
    tracking_url_provider: string;
    provider: string;
  };

  // rate_id로만 조회 — 범위를 벗어난 검색은 다른 주문 라벨을 잘못 연결할 수 있음
  const res = await fetch(
    `https://api.goshippo.com/transactions/?rate=${order.shippo_rate_id}&results=10`,
    { headers: { Authorization: `ShippoToken ${apiKey}` } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Shippo API error" }, { status: 502 });
  }

  const data = await res.json();
  const successTx = (data.results ?? []).find(
    (t: ShippoTx) => t.object_status === "SUCCESS" && t.label_url
  );

  if (!successTx) {
    return NextResponse.json({
      error: "No label found for this rate ID. If you know the tracking number, use 'Link Label' instead.",
    }, { status: 404 });
  }

  // 이 라벨이 다른 주문에 이미 연결됐는지 확인
  const { data: duplicate } = await supabase
    .from("orders")
    .select("order_number")
    .neq("id", id)
    .eq("tracking_number", successTx.tracking_number)
    .maybeSingle();

  if (duplicate) {
    return NextResponse.json(
      { error: `This label is already linked to order ${duplicate.order_number}` },
      { status: 409 }
    );
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      shippo_label_url: successTx.label_url,
      tracking_number: successTx.tracking_number || null,
      tracking_url: successTx.tracking_url_provider || null,
      carrier: successTx.provider || null,
      status: "packing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Found label but failed to save to DB" }, { status: 500 });
  }

  console.log(`[recover-label] Recovered label for order ${order.order_number} — tracking: ${successTx.tracking_number}`);

  return NextResponse.json({
    recovered: true,
    label_url: successTx.label_url,
    tracking_number: successTx.tracking_number,
    tracking_url: successTx.tracking_url_provider,
    carrier: successTx.provider,
  });
}
