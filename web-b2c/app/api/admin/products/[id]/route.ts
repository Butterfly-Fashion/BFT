import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { stripeClient } from "@/lib/stripe";
import { verifyAdminCookie } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// PATCH /api/admin/products/[id] — update product; creates new Stripe Price if price changed
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const supabase = supabaseAdmin();
  const stripe = stripeClient();

  // Fetch current product to compare price
  const { data: current, error: fetchErr } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  const fields = ["name", "slug", "category", "description", "price", "compare_at_price",
                  "weight_kg", "badge", "in_stock", "stock_qty", "status", "images", "player_cards"];
  for (const f of fields) {
    if (f in body) updates[f] = body[f];
  }

  // If price changed: archive old Stripe Price, create new one
  if (body.price != null && body.price !== current.price && current.stripe_product_id) {
    if (current.stripe_price_id) {
      await stripe.prices.update(current.stripe_price_id, { active: false }).catch(() => {});
    }
    const newPrice = await stripe.prices.create({
      product: current.stripe_product_id,
      unit_amount: Math.round(body.price * 100),
      currency: "cad",
    });
    updates.stripe_price_id = newPrice.id;
  }

  // If name changed: update Stripe Product name too
  if (body.name && body.name !== current.name && current.stripe_product_id) {
    await stripe.products.update(current.stripe_product_id, { name: body.name }).catch(() => {});
  }

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

// DELETE /api/admin/products/[id] — archive product (soft delete)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = supabaseAdmin();
  const stripe = stripeClient();

  const { data: current } = await supabase.from("products").select("stripe_product_id").eq("id", id).single();

  if (current?.stripe_product_id) {
    await stripe.products.update(current.stripe_product_id, { active: false }).catch(() => {});
  }

  const { error } = await supabase.from("products").update({ status: "archived" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
