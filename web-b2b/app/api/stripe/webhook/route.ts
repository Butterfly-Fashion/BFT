import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sendEmail, paymentReceivedEmail, adminOrderPaidEmail } from "@/lib/email";
import { requireEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, requireEnv("STRIPE_WEBHOOK_SECRET"));
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (!orderId) return NextResponse.json({ received: true });

    const { data: existingOrder } = await admin
      .from("orders")
      .select("id, total_amount, payment_status, paid_at")
      .eq("id", orderId)
      .single();

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (existingOrder.paid_at || existingOrder.payment_status === "Paid") {
      return NextResponse.json({ received: true });
    }

    const expectedAmount = Math.round(Number(existingOrder.total_amount) * 100);
    if (session.amount_total !== expectedAmount || session.currency !== "cad") {
      return NextResponse.json({ error: "Payment amount or currency mismatch" }, { status: 400 });
    }

    await admin.from("orders").update({
      status: "Paid",
      payment_status: "Paid",
      stripe_session_id: session.id,
      stripe_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : null,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", orderId);

    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${orderId.slice(0, 8).toUpperCase()}`;
    await admin.from("invoices").upsert({ order_id: orderId, invoice_number: invoiceNumber }, { onConflict: "order_id" });

    const { data: order } = await admin.from("orders").select("*, profiles(email, business_name, contact_name)").eq("id", orderId).single();
    const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://b2b.butterfly-fashion.ca";
    if (order?.profiles?.email) {
      const displayName = order.profiles.business_name || order.profiles.contact_name || order.profiles.email;
      await sendEmail({
        to: order.profiles.email,
        subject: "Payment received — Butterfly Fashion",
        html: paymentReceivedEmail(displayName, orderId, invoiceNumber, origin),
      });
    }
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const displayName = order?.profiles?.business_name || order?.profiles?.email || orderId;
      await sendEmail({
        to: adminEmail,
        subject: `Order paid — ${invoiceNumber}`,
        html: adminOrderPaidEmail(displayName, orderId, invoiceNumber, origin),
      });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (orderId) {
      await admin.from("orders").update({
        status: "Approved",
        payment_status: "Unpaid",
        stripe_payment_link: null,
        stripe_session_id: null,
        updated_at: new Date().toISOString(),
      }).eq("id", orderId).eq("payment_status", "Payment Link Sent");
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.order_id;
    if (orderId) {
      await admin.from("orders").update({
        payment_status: "Failed",
        updated_at: new Date().toISOString(),
      }).eq("id", orderId).neq("payment_status", "Paid");
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
    if (paymentIntentId) {
      await admin.from("orders").update({
        status: "Refunded",
        payment_status: "Refunded",
        updated_at: new Date().toISOString(),
      }).eq("stripe_payment_intent", paymentIntentId);
    }
  }

  return NextResponse.json({ received: true });
}
