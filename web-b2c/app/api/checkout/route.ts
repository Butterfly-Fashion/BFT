import { NextRequest, NextResponse } from "next/server";
import { CHECKOUT_DISABLED_MESSAGE, CHECKOUT_ENABLED } from "@/lib/checkout-status";
import { stripeClient, siteUrl } from "@/lib/stripe";
import type { CartItem } from "@/lib/types";

interface CheckoutBody {
  orderId: string;
  items: CartItem[];
  customerEmail: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  deliveryMethod?: "shipping" | "pickup";
  address?: {
    firstName: string;
    lastName: string;
    address: string;
    apartment?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
}

export async function POST(req: NextRequest) {
  if (!CHECKOUT_ENABLED) {
    return NextResponse.json(
      { error: CHECKOUT_DISABLED_MESSAGE },
      { status: 503 }
    );
  }

  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { orderId, items, customerEmail, shipping, tax, address, deliveryMethod } = body;

  if (!orderId || !items?.length) {
    return NextResponse.json({ error: "Missing orderId or items" }, { status: 400 });
  }

  try {
    const stripe = stripeClient();
    const base = siteUrl();

    // Fetch stripe_price_id for each cart item from Supabase
    const { supabaseAdmin } = await import("@/lib/supabase");
    const supabase = supabaseAdmin();
    const slugs = items.map((i) => i.slug).filter(Boolean);
    const { data: dbProducts } = slugs.length
      ? await supabase.from("products").select("slug, stripe_price_id").in("slug", slugs)
      : { data: [] };
    const priceMap = new Map<string, string>();
    for (const p of dbProducts ?? []) {
      if (p.stripe_price_id) priceMap.set(p.slug, p.stripe_price_id);
    }

    const line_items: import("stripe").Stripe.Checkout.SessionCreateParams.LineItem[] =
      items.map((item) => {
        const stripePriceId = item.slug ? priceMap.get(item.slug) : undefined;
        if (stripePriceId) {
          return { quantity: item.quantity, price: stripePriceId };
        }
        return {
          quantity: item.quantity,
          price_data: {
            currency: "cad",
            unit_amount: Math.round(item.price * 100),
            product_data: {
              name: item.name,
              description: item.size ? `Size: ${item.size}` : undefined,
            },
          },
        };
      });

    if (shipping > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: "cad",
          unit_amount: Math.round(shipping * 100),
          product_data: { name: "Shipping" },
        },
      });
    }

    if (tax > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: "cad",
          unit_amount: Math.round(tax * 100),
          product_data: { name: "Tax (HST 13%)" },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      line_items,
      success_url: `${base}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout`,
      metadata: {
        order_id: orderId,
        delivery_method: deliveryMethod ?? "shipping",
        ...(address && {
          shipping_name: `${address.firstName} ${address.lastName}`,
          shipping_address: [address.address, address.apartment].filter(Boolean).join(", "),
          shipping_city: address.city,
          shipping_province: address.province,
          shipping_postal: address.postalCode,
          shipping_country: address.country,
        }),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[/api/checkout]", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
