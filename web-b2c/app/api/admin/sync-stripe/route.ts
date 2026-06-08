import { NextResponse } from "next/server";
import { stripeClient } from "@/lib/stripe";
import { SHIPPING_LINE_ITEM_NAME, TAX_LINE_ITEM_NAME, isShippingOrTaxLineItem } from "@/lib/stripe-line-items";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stripe = stripeClient();
    const supabase = supabaseAdmin();

    // Fetch up to 100 paid sessions from Stripe
    const sessions = await stripe.checkout.sessions.list({ limit: 100 });
    const paid = sessions.data.filter((s) => s.payment_status === "paid");

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const session of paid) {
      try {
        const lineItemsResult = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
        const lineItems = lineItemsResult.data;

        const productItems = lineItems.filter((i) => !isShippingOrTaxLineItem(i.description));
        const shippingItem = lineItems.find((i) => i.description === SHIPPING_LINE_ITEM_NAME);
        const taxItem = lineItems.find((i) => i.description === TAX_LINE_ITEM_NAME);

        const subtotal = productItems.reduce((sum, i) => sum + (i.amount_total ?? 0) / 100, 0);
        const shippingCost = (shippingItem?.amount_total ?? 0) / 100;
        const taxAmount = (taxItem?.amount_total ?? 0) / 100;
        const total = (session.amount_total ?? 0) / 100;
        const meta = session.metadata ?? {};

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
            },
            { onConflict: "stripe_session_id" }
          )
          .select("id, created_at")
          .single();

        if (orderError) throw orderError;

        if (productItems.length > 0) {
          await supabase.from("order_items").delete().eq("order_id", order.id);
          await supabase.from("order_items").insert(
            productItems.map((item) => ({
              order_id: order.id,
              name: item.description ?? "Unknown",
              quantity: item.quantity ?? 1,
              unit_price: Math.round((item.amount_total ?? 0) / (item.quantity ?? 1)) / 100,
            }))
          );
        }

        imported++;
      } catch (err) {
        skipped++;
        errors.push(`Session ${session.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({ imported, skipped, errors: errors.slice(0, 5) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
