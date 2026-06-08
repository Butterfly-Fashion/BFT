import { NextRequest, NextResponse } from "next/server";
import { CHECKOUT_DISABLED_MESSAGE, CHECKOUT_ENABLED } from "@/lib/checkout-status";
import { stripeClient, siteUrl } from "@/lib/stripe";
import { SHIPPING_LINE_ITEM_NAME, TAX_LINE_ITEM_NAME } from "@/lib/stripe-line-items";
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
  shippoRateId?: string | null;
  carrier?: string | null;
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

  const { orderId, items, customerEmail, shipping, tax, address, deliveryMethod, shippoRateId, carrier } = body;

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

    const buildProductLineItems = (useStoredPrices: boolean) =>
      items.map((item) => {
        const stripePriceId = item.slug ? priceMap.get(item.slug) : undefined;
        if (useStoredPrices && stripePriceId) {
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

    const appendAdjustments = (
      target: import("stripe").Stripe.Checkout.SessionCreateParams.LineItem[]
    ) => {
      if (shipping > 0) {
        target.push({
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: Math.round(shipping * 100),
            product_data: { name: SHIPPING_LINE_ITEM_NAME },
          },
        });
      }

      if (tax > 0) {
        target.push({
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: Math.round(tax * 100),
            product_data: { name: TAX_LINE_ITEM_NAME },
          },
        });
      }
    };

    const line_items = buildProductLineItems(true);
    appendAdjustments(line_items);

    const fallbackLineItems = buildProductLineItems(false);
    appendAdjustments(fallbackLineItems);

    const createSession = (
      sessionLineItems: import("stripe").Stripe.Checkout.SessionCreateParams.LineItem[]
    ) => stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      line_items: sessionLineItems,
      success_url: `${base}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout`,
      metadata: {
        order_id: orderId,
        delivery_method: deliveryMethod ?? "shipping",
        ...(shippoRateId && { shippo_rate_id: shippoRateId }),
        ...(carrier && { carrier }),
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

    let session: Awaited<ReturnType<typeof createSession>>;
    try {
      session = await createSession(line_items);
    } catch (err) {
      const stripeError = err as { code?: string; param?: string };
      if (stripeError.code !== "resource_missing" || !stripeError.param?.includes("price")) {
        throw err;
      }
      console.warn("[/api/checkout] Stored Stripe price missing; retrying with inline price_data");
      session = await createSession(fallbackLineItems);
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[/api/checkout]", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
