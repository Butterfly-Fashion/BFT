import { NextRequest, NextResponse } from "next/server";
import { stripeClient } from "@/lib/stripe";
import { SHIPPING_LINE_ITEM_NAME, TAX_LINE_ITEM_NAME, isShippingOrTaxLineItem, sizeFromLineItem, slugFromLineItem } from "@/lib/stripe-line-items";
import { sendAdminOrderEmail, sendCustomerConfirmationEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      console.log(`[webhook] Payment completed — order ${orderId}, session ${session.id}`);

      let lineItems: Stripe.LineItem[] = [];
      try {
        const stripe = stripeClient();
        const result = await stripe.checkout.sessions.listLineItems(session.id, {
          limit: 100,
          expand: ["data.price.product"],
        });
        lineItems = result.data;
        await Promise.all([
          sendAdminOrderEmail(session, lineItems),
          sendCustomerConfirmationEmail(session, lineItems),
        ]);
      } catch (err) {
        console.error(`[webhook] Email sending failed for order ${orderId}:`, err);
      }

      // Save to Supabase (non-blocking — email already sent above)
      try {
        await saveOrderToSupabase(session, lineItems);
      } catch (err) {
        console.error(`[webhook] Supabase save failed for order ${orderId}:`, err);
      }
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[webhook] Session expired — order ${session.metadata?.order_id}`);
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      console.log(`[webhook] Charge refunded — charge ${charge.id}`);
      // Update order status to refunded if it exists in Supabase
      try {
        const supabase = supabaseAdmin();
        await supabase
          .from("orders")
          .update({ status: "refunded" })
          .eq("stripe_payment_intent", charge.payment_intent);
      } catch (err) {
        console.error("[webhook] Failed to update refund status:", err);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function saveOrderToSupabase(
  session: Stripe.Checkout.Session,
  lineItems: Stripe.LineItem[]
): Promise<void> {
  const supabase = supabaseAdmin();
  const meta = session.metadata ?? {};

  const productItems = lineItems.filter((i) => !isShippingOrTaxLineItem(i.description));
  const shippingItem = lineItems.find((i) => i.description === SHIPPING_LINE_ITEM_NAME);
  const taxItem = lineItems.find((i) => i.description === TAX_LINE_ITEM_NAME);

  const subtotal = productItems.reduce((sum, i) => sum + (i.amount_total ?? 0) / 100, 0);
  const shippingCost = (shippingItem?.amount_total ?? 0) / 100;
  const taxAmount = (taxItem?.amount_total ?? 0) / 100;
  const total = (session.amount_total ?? 0) / 100;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .upsert(
      {
        order_number: meta.order_id ?? session.id,
        stripe_session_id: session.id,
        stripe_payment_intent:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        channel: "b2c",
        delivery_method: meta.delivery_method ?? "shipping",
        status: "paid",
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        customer_email: session.customer_email,
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
        subtotal,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        total,
        shippo_rate_id: meta.shippo_rate_id ?? null,
        carrier: meta.carrier ?? null,
      },
      { onConflict: "stripe_session_id" }
    )
    .select("id")
    .single();

  if (orderError) throw orderError;

  if (productItems.length > 0) {
    // Delete existing items then reinsert for idempotency
    await supabase.from("order_items").delete().eq("order_id", order.id);
    await supabase.from("order_items").insert(
      productItems.map((item) => ({
        order_id: order.id,
        name: item.description ?? "Unknown",
        slug: slugFromLineItem(item),
        size: sizeFromLineItem(item),
        quantity: item.quantity ?? 1,
        unit_price:
          Math.round((item.amount_total ?? 0) / (item.quantity ?? 1)) / 100,
      }))
    );
  }

  console.log(`[webhook] Saved order ${meta.order_id} to Supabase (id: ${order.id})`);
}
