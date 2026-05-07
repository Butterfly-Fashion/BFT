import Stripe from "stripe";
import { requireEnv, siteUrl } from "@/lib/env";

export function stripeClient() {
  return new Stripe(requireEnv("STRIPE_SECRET_KEY"));
}

export async function createOrderCheckoutSession(order: { id: string; total_amount: number; customer_email: string }) {
  const stripe = stripeClient();
  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.customer_email,
    success_url: `${siteUrl()}/account/orders/${order.id}?payment=success`,
    cancel_url: `${siteUrl()}/account/orders/${order.id}`,
    metadata: {
      order_id: order.id,
    },
    payment_intent_data: {
      metadata: {
        order_id: order.id,
      },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "cad",
          product_data: {
            name: `Order ${order.id.slice(0, 8)}`,
          },
          unit_amount: Math.round(Number(order.total_amount) * 100),
        },
      },
    ],
  });
}
