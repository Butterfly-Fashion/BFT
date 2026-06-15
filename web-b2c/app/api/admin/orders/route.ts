import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";
import { enrichOrderItemsWithImages } from "@/lib/order-item-images";
import type { DbOrder, DbOrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("orders")
      .select("id,order_number,stripe_session_id,stripe_payment_intent,channel,delivery_method,status,customer_email,customer_name,shipping_address,subtotal,shipping_cost,tax_amount,total,carrier,tracking_number,tracking_url,shippo_rate_id,shippo_label_url,admin_note,created_at,updated_at,items:order_items(id,name,slug,size,quantity,unit_price,image_url)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    // Enrich every item with its catalog image in a single lookup, then
    // redistribute back to each order.
    const allItems = (data ?? []).flatMap(
      (row) => (row.items ?? []) as unknown as DbOrderItem[]
    );
    const enriched = await enrichOrderItemsWithImages(supabase, allItems);
    const imageById = new Map(enriched.map((i) => [i.id, i.image_url]));

    const orders: DbOrder[] = (data ?? []).map((row) => ({
      ...row,
      items: ((row.items ?? []) as unknown as DbOrderItem[]).map((i) => ({
        ...i,
        image_url: imageById.get(i.id) ?? i.image_url,
      })),
      _source: "supabase" as const,
    }));
    return NextResponse.json({ orders, source: "supabase", limit: 50 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
