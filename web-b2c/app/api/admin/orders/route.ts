import { NextResponse } from "next/server";
import { stripeClient } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";
import type { DbOrder, OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Try Supabase first
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .order("created_at", { ascending: false })
      .limit(500);

    if (!error) {
      const orders: DbOrder[] = (data ?? []).map((row) => ({
        ...row,
        _source: "supabase" as const,
      }));
      return NextResponse.json({ orders, source: "supabase" });
    }

    console.warn("[admin/orders] Supabase error, falling back to Stripe:", error.message);
  } catch (err) {
    console.warn("[admin/orders] Supabase unavailable, falling back to Stripe:", err);
  }

  // Stripe fallback (before migration or on Supabase error)
  try {
    const stripe = stripeClient();
    const [sessions, paymentIntents] = await Promise.all([
      stripe.checkout.sessions.list({ limit: 50 }),
      stripe.paymentIntents.list({ limit: 50 }),
    ]);

    const sessionPaymentIntentIds = new Set(
      sessions.data.map((s) => s.payment_intent).filter(Boolean)
    );

    const sessionOrders: DbOrder[] = sessions.data
      .filter((s) => s.payment_status === "paid")
      .map((s) => mapStripeSessionToDbOrder(s));

    const piOrders: DbOrder[] = paymentIntents.data
      .filter((pi) => pi.status === "succeeded" && !sessionPaymentIntentIds.has(pi.id))
      .map((pi) => mapStripeIntentToDbOrder(pi));

    const orders = [...sessionOrders, ...piOrders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ orders, source: "stripe" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function mapStripeSessionToDbOrder(s: import("stripe").Stripe.Checkout.Session): DbOrder {
  const meta = s.metadata ?? {};
  return {
    id: s.id,
    order_number: meta.order_id ?? s.id,
    stripe_session_id: s.id,
    stripe_payment_intent: typeof s.payment_intent === "string" ? s.payment_intent : null,
    channel: "b2c",
    delivery_method: (meta.delivery_method as "shipping" | "pickup") ?? "shipping",
    status: "paid" as OrderStatus,
    customer_email: s.customer_email,
    customer_name: meta.shipping_name ?? null,
    shipping_address: meta.shipping_address
      ? {
          street: meta.shipping_address,
          city: meta.shipping_city ?? "",
          province: meta.shipping_province ?? "",
          postal: meta.shipping_postal ?? "",
          country: meta.shipping_country ?? "",
        }
      : null,
    subtotal: null,
    shipping_cost: null,
    tax_amount: null,
    total: (s.amount_total ?? 0) / 100,
    carrier: null,
    tracking_number: null,
    tracking_url: null,
    admin_note: null,
    created_at: new Date(s.created * 1000).toISOString(),
    updated_at: new Date(s.created * 1000).toISOString(),
    items: [],
    _source: "stripe",
  };
}

function mapStripeIntentToDbOrder(pi: import("stripe").Stripe.PaymentIntent): DbOrder {
  const meta = pi.metadata ?? {};
  return {
    id: pi.id,
    order_number: meta.order_id ?? pi.id,
    stripe_session_id: pi.id,
    stripe_payment_intent: pi.id,
    channel: "b2c",
    delivery_method: (meta.delivery_method as "shipping" | "pickup") ?? "shipping",
    status: "paid" as OrderStatus,
    customer_email: pi.receipt_email,
    customer_name: meta.shipping_name ?? null,
    shipping_address: meta.shipping_address
      ? {
          street: meta.shipping_address,
          city: meta.shipping_city ?? "",
          province: meta.shipping_province ?? "",
          postal: meta.shipping_postal ?? "",
          country: meta.shipping_country ?? "",
        }
      : null,
    subtotal: null,
    shipping_cost: null,
    tax_amount: null,
    total: pi.amount / 100,
    carrier: null,
    tracking_number: null,
    tracking_url: null,
    admin_note: null,
    created_at: new Date(pi.created * 1000).toISOString(),
    updated_at: new Date(pi.created * 1000).toISOString(),
    items: [],
    _source: "stripe",
  };
}
