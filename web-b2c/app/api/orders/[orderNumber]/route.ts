import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;

  try {
    const supabase = supabaseAdmin();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("order_number", orderNumber)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Return safe subset for public consumption (no admin_note, no internal IDs)
    return NextResponse.json({
      order_number: order.order_number,
      delivery_method: order.delivery_method,
      status: order.status,
      customer_name: order.customer_name,
      shipping_address: order.shipping_address,
      subtotal: order.subtotal,
      shipping_cost: order.shipping_cost,
      tax_amount: order.tax_amount,
      total: order.total,
      carrier: order.carrier,
      tracking_number: order.tracking_number,
      tracking_url: order.tracking_url,
      created_at: order.created_at,
      items: (order.items ?? []).map((i: { name: string; quantity: number; unit_price: number; size: string | null }) => ({
        name: i.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        size: i.size,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
