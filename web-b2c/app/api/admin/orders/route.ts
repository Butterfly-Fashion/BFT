import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";
import type { DbOrder } from "@/lib/types";

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
      .select("id,order_number,stripe_session_id,stripe_payment_intent,channel,delivery_method,status,customer_email,customer_name,shipping_address,subtotal,shipping_cost,tax_amount,total,carrier,tracking_number,tracking_url,shippo_rate_id,shippo_label_url,admin_note,created_at,updated_at,items:order_items(id,name,quantity,unit_price,product_id)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    const orders: DbOrder[] = (data ?? []).map((row) => ({
      ...row,
      items: (row.items ?? []) as DbOrder["items"],
      _source: "supabase" as const,
    }));
    return NextResponse.json({ orders, source: "supabase", limit: 50 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
