import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { stripeClient } from "@/lib/stripe";
import { verifyAdminCookie } from "@/lib/admin-auth";
import { getB2CDescription, getB2CName } from "@/lib/product-copy";
import sourceData from "@/lib/source-products.json";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RawProduct {
  slug: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  image_source_url: string;
  image_url: string;
}

const CATEGORY_WEIGHTS: Record<string, number> = {
  "Boxing Gloves": 1.2,
  "Caps": 0.2,
  "Bucket Hats": 0.2,
  "Car Flags": 0.3,
  "Sticker Packs": 0.15,
};

const EXTRA_PRODUCTS = [
  {
    slug: "panini-fifa-world-cup-2026-sticker-box-50-packs",
    name: "Panini FIFA World Cup 2026 Sticker Box – 50 Packs",
    category: "Sticker Packs",
    base_price: 125,
    description: "The ultimate collector's haul. Each box contains 50 Panini sticker packs — over 250 stickers featuring players from all 48 nations at the FIFA World Cup 2026.",
    image_source_url: "/asset/stickers/world_cup_sticker_box_50.png",
    badge: "50 Packs",
    weight_kg: 1.5,
    player_cards: [
      { name: "Lionel Messi", imageUrl: "/asset/stickers/messi200.jpg" },
      { name: "Kylian Mbappé", imageUrl: "/asset/stickers/mbappe200.jpg" },
      { name: "Harry Kane", imageUrl: "/asset/stickers/kane200.jpg" },
      { name: "Lamine Yamal", imageUrl: "/asset/stickers/yamal200.jpg" },
      { name: "Raphinha", imageUrl: "/asset/stickers/raphinha200.jpg" },
      { name: "Virgil van Dijk", imageUrl: "/asset/stickers/vandijk200.jpg" },
    ],
  },
  {
    slug: "panini-fifa-world-cup-2026-official-sticker-album",
    name: "Panini FIFA World Cup 2026 Official Sticker Album",
    category: "Sticker Packs",
    base_price: 8.99,
    description: "The official Panini FIFA World Cup 2026 sticker album. Features dedicated pages for all 48 teams and their squads.",
    image_source_url: "/asset/stickers/fwc26_stickerbook_cover.png",
    badge: null,
    weight_kg: 0.3,
    player_cards: null,
  },
  {
    slug: "panini-fifa-world-cup-2026-official-sticker-album-hard-cover",
    name: "Panini FIFA World Cup 2026 Official Sticker Album – Hard Cover",
    category: "Sticker Packs",
    base_price: 29.99,
    description: "The premium hardcover edition of the official Panini FIFA World Cup 2026 sticker album. 112 pages with dedicated pages for all 48 national teams, stadiums, and tournament highlights. Built to last — hard cover protects your collection for years.",
    image_source_url: "/asset/stickers/fwc26_stickerbook_cover.png",
    badge: "Hard Cover",
    weight_kg: 0.4,
    player_cards: null,
  },
  {
    slug: "panini-fifa-world-cup-2026-bundle-album-sticker-box",
    name: "Panini FIFA World Cup 2026 Bundle — Official Album + 50-Pack Box",
    category: "Sticker Packs",
    base_price: 130,
    description: "The ultimate World Cup 2026 collector's bundle. Get the Official Panini Sticker Album and the full 50-Pack Sticker Box together.",
    image_source_url: "/asset/stickers/fwc26_bundle_main.png",
    badge: "Bundle",
    weight_kg: 1.8,
    player_cards: [
      { name: "Lionel Messi", imageUrl: "/asset/stickers/messi200.jpg" },
      { name: "Kylian Mbappé", imageUrl: "/asset/stickers/mbappe200.jpg" },
      { name: "Harry Kane", imageUrl: "/asset/stickers/kane200.jpg" },
      { name: "Lamine Yamal", imageUrl: "/asset/stickers/yamal200.jpg" },
    ],
  },
];

export async function POST() {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = supabaseAdmin();
  const stripe = stripeClient();

  const raw = sourceData as RawProduct[];
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  // EXTRA_PRODUCTS first so they're never skipped by timeout
  const allProducts = [
    ...EXTRA_PRODUCTS.map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      description: p.description,
      price: p.base_price,
      weight_kg: p.weight_kg,
      image_url: p.image_source_url,
      badge: p.badge,
      player_cards: p.player_cards,
    })),
    ...raw.map((p) => ({
      slug: p.slug,
      name: getB2CName(p.name, p.category),
      category: p.category,
      description: getB2CDescription(p.name, p.category),
      price: p.base_price,
      weight_kg: CATEGORY_WEIGHTS[p.category] ?? 0.5,
      image_url: p.image_source_url,
      badge: null as string | null,
      player_cards: null as unknown[] | null,
    })),
  ];

  for (const p of allProducts) {
    try {
      const { data: existing } = await supabase
        .from("b2c_products")
        .select("id, stripe_product_id, stripe_price_id")
        .eq("slug", p.slug)
        .single();

      let stripeProductId = existing?.stripe_product_id;
      let stripePriceId = existing?.stripe_price_id;

      if (!stripeProductId) {
        const sp = await stripe.products.create({
          name: p.name,
          description: p.description ?? undefined,
          metadata: { slug: p.slug, category: p.category },
        });
        stripeProductId = sp.id;
      }

      if (!stripePriceId) {
        const sp = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: Math.round(p.price * 100),
          currency: "cad",
        });
        stripePriceId = sp.id;
      }

      await supabase.from("b2c_products").upsert(
        {
          slug: p.slug,
          name: p.name,
          category: p.category,
          description: p.description,
          price: p.price,
          compare_at_price: null,
          weight_kg: p.weight_kg,
          badge: p.badge,
          in_stock: true,
          stock_qty: null,
          status: "active",
          images: [{ url: p.image_url, alt: p.name }],
          player_cards: p.player_cards,
          stripe_product_id: stripeProductId,
          stripe_price_id: stripePriceId,
        },
        { onConflict: "slug" }
      );

      inserted++;
    } catch (err) {
      skipped++;
      errors.push(`${p.slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ inserted, skipped, total: allProducts.length, errors: errors.slice(0, 10) });
}
