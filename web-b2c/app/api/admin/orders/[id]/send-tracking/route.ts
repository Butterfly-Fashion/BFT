import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";
import { sendTrackingEmail, sendPickupReadyEmail } from "@/lib/email";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const supabase = supabaseAdmin();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.customer_email) {
      return NextResponse.json({ error: "Order has no customer email" }, { status: 400 });
    }

    const items = (order.items ?? []).map((i: { name: string; quantity: number; unit_price: number }) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unit_price,
    }));

    if (order.delivery_method === "pickup") {
      await sendPickupReadyEmail({
        orderNumber: order.order_number,
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        items,
        total: order.total ?? 0,
      });
    } else {
      if (!order.tracking_number) {
        return NextResponse.json(
          { error: "No tracking number set — add one before sending the email" },
          { status: 400 }
        );
      }
      await sendTrackingEmail({
        orderNumber: order.order_number,
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        carrier: order.carrier ?? "Carrier",
        trackingNumber: order.tracking_number,
        trackingUrl: order.tracking_url,
        items,
        total: order.total ?? 0,
      });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
