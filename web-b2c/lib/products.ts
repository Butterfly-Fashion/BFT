import { supabaseAdmin } from "./supabase";
import type { DbProduct, Product } from "./types";
import { getB2CDescription, getB2CName } from "./product-copy";
import sourceData from "./source-products.json";

const CATEGORY_GRADIENTS: Record<string, string> = {
  "Fashion":      "linear-gradient(145deg, #1a1a2e 0%, #2d4a7a 100%)",
  "Collectibles": "linear-gradient(145deg, #4a2d6e 0%, #7c4aa8 100%)",
  "Accessories":  "linear-gradient(145deg, #4a3a2d 0%, #8b6914 100%)",
};

// Per-category shipping weights (kg) — product + typical packaging materials
// Sources: eBay/Amazon listings, Canada Post guides, manufacturer specs
const CATEGORY_WEIGHTS: Record<string, number> = {
  "Fashion":      0.25,
  "Collectibles": 0.20,
  "Accessories":  0.15,
};

export function dbProductToProduct(p: DbProduct): Product {
  const imageUrl = p.images?.[0]?.url || p.image_url || "";
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: Number(p.price) || 0,
    comparePrice: p.compare_at_price ?? undefined,
    description: p.description ?? "",
    imageUrl,
    additionalImages: p.images?.slice(1).map((i) => i.url),
    placeholderGradient: CATEGORY_GRADIENTS[p.category] ?? "linear-gradient(145deg, #555 0%, #888 100%)",
    inStock: p.in_stock,
    badge: p.badge ?? undefined,
    weightKg: p.weight_kg,
    playerCards: p.player_cards ?? undefined,
  };
}

// ─── Static fallback (used when DB unavailable) ──────────────────────────────

interface RawProduct {
  slug: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  image_source_url: string;
}

const raw = sourceData as RawProduct[];

const staticProducts: Product[] = [
  ...raw.map((p, i) => ({
    id: String(i + 1),
    slug: p.slug,
    name: getB2CName(p.name, p.category),
    category: p.category,
    price: p.base_price,
    description: getB2CDescription(p.name, p.category),
    imageUrl: p.image_source_url,
    placeholderGradient: CATEGORY_GRADIENTS[p.category] ?? "linear-gradient(145deg, #555 0%, #888 100%)",
    inStock: true,
    weightKg: CATEGORY_WEIGHTS[p.category] ?? 0.5,
  })),
  {
    id: String(raw.length + 1),
    slug: "panini-fifa-world-cup-2026-sticker-box-50-packs",
    name: "Panini FIFA World Cup 2026 Sticker Box – 50 Packs",
    category: "Collectibles",
    price: 125,
    description: "The ultimate collector's haul. Each box contains 50 Panini sticker packs — over 250 stickers featuring players from all 48 nations.",
    imageUrl: "/asset/stickers/world_cup_sticker_box_50.png",
    placeholderGradient: CATEGORY_GRADIENTS["Sticker Packs"],
    inStock: true,
    badge: "50 Packs",
    weightKg: 1.5,
  },
  {
    id: String(raw.length + 2),
    slug: "panini-fifa-world-cup-2026-official-sticker-album",
    name: "Panini FIFA World Cup 2026 Official Sticker Album",
    category: "Collectibles",
    price: 8.99,
    description: "The official Panini FIFA World Cup 2026 sticker album. Features dedicated pages for all 48 teams.",
    imageUrl: "/asset/stickers/fwc26_stickerbook_cover.png",
    placeholderGradient: CATEGORY_GRADIENTS["Sticker Packs"],
    inStock: true,
    weightKg: 0.3,
  },
  {
    id: String(raw.length + 3),
    slug: "panini-fifa-world-cup-2026-bundle-album-sticker-box",
    name: "Panini FIFA World Cup 2026 Bundle — Official Album + 50-Pack Box",
    category: "Collectibles",
    price: 130,
    description: "The ultimate World Cup 2026 collector's bundle. Album + 50-Pack Box together.",
    imageUrl: "/asset/stickers/fwc26_bundle_main.png",
    placeholderGradient: CATEGORY_GRADIENTS["Sticker Packs"],
    inStock: true,
    badge: "Bundle",
    weightKg: 1.8,
  },
];

// ─── DB-backed async functions ────────────────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error || !data?.length) return staticProducts;
    return (data as DbProduct[]).map(dbProductToProduct);
  } catch {
    return staticProducts;
  }
}

export async function getProductBySlugFromDb(slug: string): Promise<Product | undefined> {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error || !data) return staticProducts.find((p) => p.slug === slug);
    return dbProductToProduct(data as DbProduct);
  } catch {
    return staticProducts.find((p) => p.slug === slug);
  }
}

export async function getAllSlugs(): Promise<string[]> {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase.from("products").select("slug").eq("status", "active");
    if (error || !data?.length) return staticProducts.map((p) => p.slug);
    return data.map((p: { slug: string }) => p.slug);
  } catch {
    return staticProducts.map((p) => p.slug);
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const all = await getAllProducts();
  const canadaFirst = all.filter((p) => p.name.toLowerCase().includes("canada"));
  const rest = all.filter((p) => !p.name.toLowerCase().includes("canada"));
  return [...canadaFirst, ...rest].slice(0, 8);
}

export async function getTrendingProducts(): Promise<Product[]> {
  const all = await getAllProducts();
  const priority = [
    "panini-fifa-world-cup-2026-bundle-album-sticker-box",
    "panini-fifa-world-cup-2026-official-sticker-album",
  ]
    .map((slug) => all.find((p) => p.slug === slug))
    .filter((p): p is Product => Boolean(p));
  const canadaFirst = all.filter(
    (p) => p.name.toLowerCase().includes("canada") && !priority.find((x) => x.slug === p.slug)
  );
  const rest = all.filter(
    (p) => !p.name.toLowerCase().includes("canada") && !priority.find((x) => x.slug === p.slug)
  );
  return [...priority, ...canadaFirst, ...rest].slice(0, 4);
}

// Sync export for build-time static generation.
// These are kept only for SSG generateStaticParams which needs sync slugs at build time.
// Pages should prefer the async functions above.

export const products: Product[] = staticProducts;
