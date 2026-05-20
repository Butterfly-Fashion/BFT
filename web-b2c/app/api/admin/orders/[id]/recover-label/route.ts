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
    return NextResponse.json({ error: "Label already saved", label_url: order.shippo_label_url }, { status: 409 });
  }

  type ShippoTx = {
    object_id: string;
    object_status: string;
    label_url: string;
    tracking_number: string;
    tracking_url_provider: string;
    provider: string;
  };

  let successTx: ShippoTx | undefined;

  // 1차: 저장된 rate_id로 조회
  if (order.shippo_rate_id) {
    const res = await fetch(
      `https://api.goshippo.com/transactions/?rate=${order.shippo_rate_id}&results=10`,
      { headers: { Authorization: `ShippoToken ${apiKey}` } }
    );
    if (res.ok) {
      const data = await res.json();
      successTx = (data.results ?? []).find(
        (t: ShippoTx) => t.object_status === "SUCCESS" && t.label_url
      );
    }
  }

  // 2차: rate_id로 못 찾으면 최근 트랜잭션 전체에서 조회
  // (Canada Post fallback으로 다른 rate_id로 생성된 경우)
  if (!successTx) {
    const res = await fetch(
      `https://api.goshippo.com/transactions/?results=50`,
      { headers: { Authorization: `ShippoToken ${apiKey}` } }
    );
    if (res.ok) {
      const data = await res.json();
      successTx = (data.results ?? []).find(
        (t: ShippoTx) => t.object_status === "SUCCESS" && t.label_url
      );
    }
  }

  if (!successTx) {
    return NextResponse.json({
      error: "No successful transaction found in Shippo. Check Shippo dashboard → Transactions.",
    }, { status: 404 });
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
