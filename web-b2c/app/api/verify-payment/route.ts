import { NextRequest, NextResponse } from "next/server";
import { stripeClient } from "@/lib/stripe";
import type { Order } from "@/lib/types";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const stripe = stripeClient();
    const [session, lineItemsPage] = await Promise.all([
      stripe.checkout.sessions.retrieve(sessionId),
      stripe.checkout.sessions.listLineItems(sessionId, { limit: 20 }),
    ]);

    const paid = session.payment_status === "paid";
    const orderId = session.metadata?.order_id ?? null;

    if (!paid) {
      return NextResponse.json({ paid: false, orderId });
    }

    // Reconstruct order from Stripe data (used when localStorage is unavailable)
    const lineItems = lineItemsPage.data;
    const shippingItem = lineItems.find((i) => i.description === "Shipping");
    const taxItem = lineItems.find((i) => i.description === "Tax (HST 13%)");
    const productItems = lineItems.filter(
      (i) => i.description !== "Shipping" && i.description !== "Tax (HST 13%)"
    );

    const shipping = (shippingItem?.amount_total ?? 0) / 100;
    const tax = (taxItem?.amount_total ?? 0) / 100;
    const subtotal = productItems.reduce((sum, i) => sum + (i.amount_total ?? 0) / 100, 0);
    const total = (session.amount_total ?? 0) / 100;

    const nameParts = (session.metadata?.shipping_name ?? "").split(" ");
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ");

    const fallbackOrder: Order = {
      id: orderId ?? sessionId,
      items: productItems.map((item) => ({
        id: "",
        slug: "",
        name: item.description ?? "Product",
        price: (item.amount_total ?? 0) / 100 / (item.quantity ?? 1),
        quantity: item.quantity ?? 1,
        size: undefined,
        imageUrl: "",
        placeholderGradient: "linear-gradient(135deg, #f0f0f0, #e0e0e0)",
        weightKg: 0.5,
      })),
      address: {
        firstName,
        lastName,
        email: session.customer_email ?? "",
        address: session.metadata?.shipping_address ?? "",
        apartment: undefined,
        city: session.metadata?.shipping_city ?? "",
        province: session.metadata?.shipping_province ?? "",
        postalCode: session.metadata?.shipping_postal ?? "",
        country: session.metadata?.shipping_country ?? "Canada",
      },
      subtotal,
      shipping,
      tax,
      total,
      createdAt: new Date(session.created * 1000).toISOString(),
    };

    return NextResponse.json({
      paid: true,
      orderId,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
      fallbackOrder,
    });
  } catch (err) {
    console.error("[/api/verify-payment]", err);
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 });
  }
}
