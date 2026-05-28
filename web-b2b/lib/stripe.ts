import Stripe from "stripe";
import { requireEnv, siteUrl } from "@/lib/env";

export function stripeClient() {
  return new Stripe(requireEnv("STRIPE_SECRET_KEY"));
}

type SyncB2BProductInput = {
  name: string;
  description?: string | null;
  sku: string;
  slug: string;
  category: string;
  unitPrice: number;
  isHidden: boolean;
  currentUnitPrice?: number | null;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
};

export async function syncB2BProductToStripe(input: SyncB2BProductInput) {
  const stripe = stripeClient();
  const active = !input.isHidden;
  const metadata = {
    sku: input.sku,
    slug: input.slug,
    category: input.category,
    channel: "b2b",
  };

  let stripeProductId = input.stripeProductId || "";
  if (stripeProductId) {
    await stripe.products.update(stripeProductId, {
      name: input.name,
      description: input.description || undefined,
      active,
      metadata,
    });
  } else {
    const product = await stripe.products.create({
      name: input.name,
      description: input.description || undefined,
      active,
      metadata,
    });
    stripeProductId = product.id;
  }

  const nextAmount = Math.round(Number(input.unitPrice || 0) * 100);
  const currentAmount =
    input.currentUnitPrice == null ? null : Math.round(Number(input.currentUnitPrice || 0) * 100);
  const needsNewPrice = !input.stripePriceId || currentAmount !== nextAmount;

  let stripePriceId = input.stripePriceId || "";
  if (needsNewPrice) {
    if (stripePriceId) {
      await stripe.prices.update(stripePriceId, { active: false }).catch(() => {});
    }
    const price = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: nextAmount,
      currency: "cad",
      metadata,
    });
    stripePriceId = price.id;
  }

  return { stripeProductId, stripePriceId };
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
