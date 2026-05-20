import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";

// Shippo에서 이미 결제된 라벨을 rate_id로 조회해서 DB에 저장
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

  if (!order.shippo_rate_id) {
    return NextResponse.json({ error: "No rate ID on this order" }, { status: 400 });
  }

  if (order.shippo_label_url) {
    return NextResponse.json({ error: "Label already saved", label_url: order.shippo_label_url }, { status: 409 });
  }

  // Shippo에서 이 rate_id로 생성된 트랜잭션 조회
  const res = await fetch(
    `https://api.goshippo.com/transactions/?rate=${order.shippo_rate_id}&results=5`,
    { headers: { Authorization: `ShippoToken ${apiKey}` } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Shippo API error" }, { status: 502 });
  }

  const data = await res.json();
  const transactions: Array<{
    object_id: string;
    object_status: string;
    label_url: string;
    tracking_number: string;
    tracking_url_provider: string;
    provider: string;
  }> = data.results ?? [];

  // SUCCESS 상태인 트랜잭션 찾기
  const successTx = transactions.find((t) => t.object_status === "SUCCESS" && t.label_url);

  if (!successTx) {
    return NextResponse.json({
      error: "No successful transaction found for this rate ID",
      transactions: transactions.map((t) => ({
        id: t.object_id,
        status: t.object_status,
        hasLabel: !!t.label_url,
      })),
    }, { status: 404 });
  }

  // DB에 저장
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
