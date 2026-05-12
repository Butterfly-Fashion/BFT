import { NextResponse } from "next/server";
import { stripeClient } from "@/lib/stripe";
import { verifyAdminCookie } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuthenticated = await verifyAdminCookie();

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stripe = stripeClient();

    const [sessions, paymentIntents] = await Promise.all([
      stripe.checkout.sessions.list({ limit: 50 }),
      stripe.paymentIntents.list({ limit: 50 }),
    ]);

    const sessionOrders = sessions.data
      .filter((s) => s.payment_status === "paid")
      .map((s) => ({
        id: s.id,
        orderId: s.metadata?.order_id ?? null,
        email: s.customer_email,
        amount: (s.amount_total ?? 0) / 100,
        currency: s.currency,
        date: new Date(s.created * 1000).toISOString(),
        shippingName: s.metadata?.shipping_name ?? null,
        shippingAddress: s.metadata?.shipping_address ?? null,
        shippingCity: s.metadata?.shipping_city ?? null,
        shippingProvince: s.metadata?.shipping_province ?? null,
        shippingPostal: s.metadata?.shipping_postal ?? null,
        shippingCountry: s.metadata?.shipping_country ?? null,
      }));

    const sessionPaymentIntentIds = new Set(
      sessions.data.map((s) => s.payment_intent).filter(Boolean)
    );

    const piOrders = paymentIntents.data
      .filter((pi) => pi.status === "succeeded" && !sessionPaymentIntentIds.has(pi.id))
      .map((pi) => ({
        id: pi.id,
        orderId: pi.metadata?.order_id ?? null,
        email: pi.receipt_email,
        amount: pi.amount / 100,
        currency: pi.currency,
        date: new Date(pi.created * 1000).toISOString(),
        shippingName: pi.metadata?.shipping_name ?? null,
        shippingAddress: pi.metadata?.shipping_address ?? null,
        shippingCity: pi.metadata?.shipping_city ?? null,
        shippingProvince: pi.metadata?.shipping_province ?? null,
        shippingPostal: pi.metadata?.shipping_postal ?? null,
        shippingCountry: pi.metadata?.shipping_country ?? null,
      }));

    const paidOrders = [...sessionOrders, ...piOrders].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(paidOrders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
