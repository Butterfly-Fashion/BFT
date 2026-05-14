import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { stripeClient } from "@/lib/stripe";
import { verifyAdminCookie } from "@/lib/admin-auth";
import type { DbProductImage } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/admin/products — lightweight product list
export async function GET(req: NextRequest) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);
  const search = searchParams.get("search")?.trim();
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  const supabase = supabaseAdmin();
  let query = supabase
    .from("products")
    .select(
      "id,name,slug,category,price,compare_at_price,in_stock,stock_qty,status,images,stripe_product_id,stripe_price_id,created_at,updated_at",
      { count: "exact" }
    );

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const products = (data ?? []).map((product) => ({
    ...product,
    images: Array.isArray(product.images)
      ? (product.images as DbProductImage[]).slice(0, 1)
      : [],
  }));

  return NextResponse.json({
    products,
    total: count ?? products.length,
    limit,
    offset,
    hasMore: offset + products.length < (count ?? products.length),
  });
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
