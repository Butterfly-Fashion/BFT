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
    description: "Official Panini FIFA World Cup 2026 sealed 50-pack sticker box. Includes 350 stickers total across all 48 nations, with rare parallels possible. Pickup today in North York or ships from Toronto.",
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
    slug: "panini-fifa-world-cup-2026-sticker-pack-single",
    name: "Panini FIFA World Cup 2026 Sticker Pack – 1 Pack",
    category: "Sticker Packs",
    base_price: 3.99,
    description: "One official Panini FIFA World Cup 2026 sticker pack. 7 stickers per pack featuring players from all 48 nations. Perfect for trying your luck or topping up your collection.",
    image_source_url: "/asset/stickers/fwc26_stickerbook_cover.png",
    badge: "1 Pack",
    weight_kg: 0.05,
    player_cards: null,
  },
  {
    slug: "panini-fifa-world-cup-2026-starter-kit-album-10-packs",
    name: "Panini FIFA World Cup 2026 Starter Kit – Album + 10 Packs",
    category: "Sticker Packs",
    base_price: 34.99,
    description: "Everything you need to start your collection. Official Panini sticker album plus 10 packs — 70 stickers to kick things off. Best way to begin before kickoff.",
    image_source_url: "/asset/stickers/fwc26_stickerbook_cover.png",
    badge: "Starter Kit",
    weight_kg: 0.5,
    player_cards: null,
  },
  {
    slug: "panini-fifa-world-cup-2026-bundle-hard-cover-sticker-box",
    name: "Panini FIFA World Cup 2026 Bundle – Hard Cover Album + 50-Pack Box",
    category: "Sticker Packs",
    base_price: 149.99,
    description: "The premium collector bundle. Hard cover album built to last, paired with the full 50-Pack Sticker Box. 350 stickers, all 48 nations. Pickup today or ship from Toronto.",
    image_source_url: "/asset/stickers/fwc26_bundle_main.png",
    badge: "Premium Bundle",
    weight_kg: 2.2,
    player_cards: null,
  },
  {
    slug: "panini-fifa-world-cup-2026-sticker-packs-5",
    name: "Panini FIFA World Cup 2026 Sticker Packs – 5 Packs",
    category: "Sticker Packs",
    base_price: 14.99,
    description: "Five official Panini FIFA World Cup 2026 sticker packs. 35 stickers total featuring players from all 48 nations. A great way to grow your collection without committing to a full box.",
    image_source_url: "/asset/stickers/sticker5.png",
    badge: "5 Packs",
    weight_kg: 0.15,
    player_cards: null,
  },
  {
    slug: "panini-fifa-world-cup-2026-sticker-packs-10",
    name: "Panini FIFA World Cup 2026 Sticker Packs – 10 Packs",
    category: "Sticker Packs",
    base_price: 27.99,
    description: "Ten official Panini FIFA World Cup 2026 sticker packs. 70 stickers total from all 48 nations. The right amount to make real progress on your album without buying a full box.",
    image_source_url: "/asset/stickers/sticker10.png",
    badge: "10 Packs",
    weight_kg: 0.25,
    player_cards: null,
  },
  {
    slug: "panini-fifa-world-cup-2026-sticker-packs-20",
    name: "Panini FIFA World Cup 2026 Sticker Packs – 20 Packs",
    category: "Sticker Packs",
    base_price: 52.99,
    description: "Twenty official Panini FIFA World Cup 2026 sticker packs. 140 stickers total covering all 48 nations. Serious progress on your collection — nearly half a full box.",
    image_source_url: "/asset/stickers/sticker20.png",
    badge: "20 Packs",
    weight_kg: 0.45,
    player_cards: null,
  },
  {
    slug: "panini-fifa-world-cup-2026-bundle-album-sticker-box",
    name: "Panini FIFA World Cup 2026 Bundle — Official Album + 50-Pack Box",
    category: "Sticker Packs",
    base_price: 130,
    description: "Official Panini FIFA World Cup 2026 sticker album plus sealed 50-pack box together. Includes 350 stickers in the box. Pickup today in North York or ships from Toronto.",
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
