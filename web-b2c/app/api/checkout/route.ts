import { NextRequest, NextResponse } from "next/server";
import { CHECKOUT_DISABLED_MESSAGE, CHECKOUT_ENABLED, SHIPPING_MIN_MESSAGE, SHIPPING_MIN_SUBTOTAL } from "@/lib/checkout-status";
import { checkSwitch } from "@/lib/emergency-switches";
import { stripeClient, siteUrl } from "@/lib/stripe";
import { SHIPPING_LINE_ITEM_NAME, TAX_LINE_ITEM_NAME } from "@/lib/stripe-line-items";
import { applyJerseyTiers, JERSEY_KIT_SLUGS } from "@/lib/jersey-pricing";
import { SOLD_OUT_PRODUCT_SLUGS } from "@/lib/sold-out";
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

  // This single endpoint both creates the order and starts Stripe payment, so
  // either the order-creation or the payment-specific emergency switch blocks it.
  const orderSwitch = await checkSwitch("tier2_b2c_orders");
  if (orderSwitch.blocked) {
    return NextResponse.json({ error: orderSwitch.message }, { status: 503 });
  }
  const paymentSwitch = await checkSwitch("tier1_payment");
  if (paymentSwitch.blocked) {
    return NextResponse.json({ error: paymentSwitch.message }, { status: 503 });
  }

  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { orderId, customerEmail, shipping, tax, address, deliveryMethod, shippoRateId, carrier } = body;

  if (!orderId || !body.items?.length) {
    return NextResponse.json({ error: "Missing orderId or items" }, { status: 400 });
  }

  // Sold-out products can't be checked out even if they linger in an old cart.
  const soldOut = body.items.find((item) => SOLD_OUT_PRODUCT_SLUGS.has(item.slug));
  if (soldOut) {
    return NextResponse.json(
      { error: `"${soldOut.name}" is sold out. Please remove it from your cart to continue.` },
      { status: 409 }
    );
  }

  // Server-side authority on jersey volume pricing — never trust client prices for kits.
  const items = applyJerseyTiers(body.items);

  // Shipping is reserved for $200+ orders (server-computed subtotal, can't be bypassed).
  // Pickup is always allowed.
  const serverSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  if (deliveryMethod === "shipping" && serverSubtotal < SHIPPING_MIN_SUBTOTAL) {
    return NextResponse.json({ error: SHIPPING_MIN_MESSAGE }, { status: 422 });
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
        // Jersey kits always use the tier-priced inline amount, never a stored Stripe price.
        // Sized items also stay inline so the "Size: X" description reaches Stripe.
        const stripePriceId =
          item.slug && !item.size && !JERSEY_KIT_SLUGS.has(item.slug)
            ? priceMap.get(item.slug)
            : undefined;
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
