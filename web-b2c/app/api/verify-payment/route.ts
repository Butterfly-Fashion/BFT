import { NextRequest, NextResponse } from "next/server";
import { stripeClient } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const stripe = stripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid = session.payment_status === "paid";
    const orderId = session.metadata?.order_id ?? null;

    return NextResponse.json({
      paid,
      orderId,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
    });
  } catch (err) {
    console.error("[/api/verify-payment]", err);
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 });
  }
}
