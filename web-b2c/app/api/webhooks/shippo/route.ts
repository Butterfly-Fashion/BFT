import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

type ShippoTrackingPayload = {
  event: string;
  data: {
    tracking_number: string;
    carrier: string;
    tracking_status: {
      status: string;
      status_date: string;
      status_details: string;
    };
  };
};

function verifySignature(rawBody: string, header: string, secret: string): boolean {
  // Shippo sends either "sha256=<hex>" or raw hex
  const hex = header.startsWith("sha256=") ? header.slice(7) : header;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hex, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const secret = process.env.SHIPPO_WEBHOOK_SECRET;
  if (secret) {
    const sig = req.headers.get("x-shippo-signature") ?? "";
    if (!sig || !verifySignature(rawBody, sig, secret)) {
      console.warn("[shippo-webhook] Invalid signature — rejected");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.warn("[shippo-webhook] SHIPPO_WEBHOOK_SECRET not set — skipping signature check");
  }

  let payload: ShippoTrackingPayload;
  try {
    payload = JSON.parse(rawBody) as ShippoTrackingPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only handle tracking updates
  if (payload.event !== "track_updated") {
    return NextResponse.json({ ok: true });
  }

  const { tracking_number, carrier, tracking_status } = payload.data ?? {};
  const status = tracking_status?.status;

  if (!tracking_number || !status) {
    return NextResponse.json({ ok: true });
  }

  console.log(`[shippo-webhook] ${carrier} ${tracking_number} → ${status}`);

  if (status !== "DELIVERED") {
    return NextResponse.json({ ok: true });
  }

  const supabase = supabaseAdmin();

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_number, status")
    .eq("tracking_number", tracking_number)
    .maybeSingle();

  if (error || !order) {
    console.warn(`[shippo-webhook] No order found for tracking ${tracking_number}`);
    return NextResponse.json({ ok: true });
  }

  if (order.status === "completed") {
    console.log(`[shippo-webhook] Order ${order.order_number} already completed — skip`);
    return NextResponse.json({ ok: true });
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", order.id);

  if (updateError) {
    console.error(`[shippo-webhook] Failed to update order ${order.order_number}:`, updateError);
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  console.log(`[shippo-webhook] Order ${order.order_number} → completed (${carrier} delivered)`);
  return NextResponse.json({ ok: true });
}
