import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";
import { stripeClient } from "@/lib/stripe";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  // amount is in CAD dollars (e.g. 25.00); omit for full refund
  const amountCad: number | undefined =
    body.amount !== undefined && body.amount !== "" ? Number(body.amount) : undefined;

  const supabase = supabaseAdmin();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, order_number, stripe_payment_intent, status, total")
    .eq("id", id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status === "refunded") {
    return NextResponse.json({ error: "Order is already fully refunded." }, { status: 409 });
  }

  if (!order.stripe_payment_intent) {
    return NextResponse.json(
      { error: "No Stripe payment on this order. Refund manually in the Stripe dashboard." },
      { status: 400 }
    );
  }

  const stripe = stripeClient();

  // Check how much has already been refunded
  const existingRefunds = await stripe.refunds.list({
    payment_intent: order.stripe_payment_intent,
    limit: 100,
  });
  const alreadyRefundedCents = existingRefunds.data
    .filter((r) => r.status === "succeeded" || r.status === "pending")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPaidCents = Math.round((order.total ?? 0) * 100);
  const refundableCents = totalPaidCents - alreadyRefundedCents;

  if (refundableCents <= 0) {
    return NextResponse.json(
      { error: "This payment has already been fully refunded in Stripe." },
      { status: 409 }
    );
  }

  // Validate requested amount
  if (amountCad !== undefined) {
    if (isNaN(amountCad) || amountCad <= 0) {
      return NextResponse.json({ error: "Invalid refund amount." }, { status: 400 });
    }
    const requestedCents = Math.round(amountCad * 100);
    if (requestedCents > refundableCents) {
      return NextResponse.json(
        {
          error: `Max refundable amount is $${(refundableCents / 100).toFixed(2)} CAD (already refunded $${(alreadyRefundedCents / 100).toFixed(2)}).`,
        },
        { status: 400 }
      );
    }
  }

  const refundCents =
    amountCad !== undefined ? Math.round(amountCad * 100) : refundableCents;
  const isFullRefund = refundCents >= refundableCents;

  let stripeRefund;
  try {
    stripeRefund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent,
      amount: refundCents,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe refund failed";
    console.error("[refund] Stripe error:", msg);
    return NextResponse.json({ error: `Stripe: ${msg}` }, { status: 502 });
  }

  if (stripeRefund.status === "failed") {
    return NextResponse.json(
      { error: `Stripe refund failed: ${stripeRefund.failure_reason ?? "unknown"}` },
      { status: 502 }
    );
  }

  const newStatus = isFullRefund ? "refunded" : "cancelled";
  const note = isFullRefund
    ? null
    : `Partial refund of $${(refundCents / 100).toFixed(2)} CAD issued. Stripe refund ID: ${stripeRefund.id}`;

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (note) updatePayload.admin_note = note;

  const { data: updatedOrder } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", id)
    .select("*, items:order_items(*)")
    .single();

  console.log(
    `[refund] Order ${order.order_number}: $${(refundCents / 100).toFixed(2)} CAD refunded via Stripe (${isFullRefund ? "full" : "partial"})`
  );

  return NextResponse.json({
    refunded: true,
    amount_refunded_cad: refundCents / 100,
    is_full_refund: isFullRefund,
    stripe_refund_id: stripeRefund.id,
    stripe_refund_status: stripeRefund.status,
    new_status: newStatus,
    order: updatedOrder,
  });
}
