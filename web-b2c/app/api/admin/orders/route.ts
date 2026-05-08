import { NextResponse } from "next/server";
import { stripeClient } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get("password");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stripe = stripeClient();
    const sessions = await stripe.checkout.sessions.list({
      limit: 50,
      expand: ["data.line_items"],
    });

    const paidSessions = sessions.data
      .filter((session) => session.payment_status === "paid")
      .map((session) => ({
        id: session.id,
        orderId: session.metadata?.order_id ?? null,
        email: session.customer_email,
        amount: (session.amount_total ?? 0) / 100,
        currency: session.currency,
        date: new Date(session.created * 1000).toISOString(),
      }));

    return NextResponse.json(paidSessions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
