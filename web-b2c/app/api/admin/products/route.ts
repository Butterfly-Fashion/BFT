import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { stripeClient } from "@/lib/stripe";
import { verifyAdminCookie } from "@/lib/admin-auth";
import type { DbProduct } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/admin/products — list all products
export async function GET() {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

// POST /api/admin/products — create product + auto-create Stripe Product/Price
export async function POST(req: NextRequest) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, slug, category, description, price, compare_at_price, weight_kg,
          badge, in_stock, stock_qty, status, images, player_cards } = body;

  if (!name || !slug || !category || price == null) {
    return NextResponse.json({ error: "name, slug, category, price are required" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const stripe = stripeClient();

  // Create Stripe Product
  const stripeProduct = await stripe.products.create({
    name,
    description: description ?? undefined,
    metadata: { slug, category },
  });

  // Create Stripe Price
  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: Math.round(price * 100),
    currency: "cad",
  });

  const { data, error } = await supabase
    .from("products")
    .insert({
      name, slug, category, description: description ?? null,
      price, compare_at_price: compare_at_price ?? null,
      weight_kg: weight_kg ?? 0.5,
      badge: badge ?? null,
      in_stock: in_stock ?? true,
      stock_qty: stock_qty ?? null,
      status: status ?? "active",
      images: images ?? [],
      player_cards: player_cards ?? null,
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice.id,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data }, { status: 201 });
}
