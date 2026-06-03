import { supabaseAdmin } from "./supabase";
import type { Product } from "./types";
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

// ─── Static B2C catalog ─────────────────────────────────────────────────────

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
    description: "You don't know what's inside until you open it. Messi, Mbappé, Yamal, Ronaldo — rare parallels hidden across 50 packs. 250+ stickers. All 48 nations. One collection you'll remember.",
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
    description: "Every great collection starts here. The official album holds all 670 stickers — 48 nations, the full tournament. Get it first so every pack you open has a home.",
    imageUrl: "/asset/stickers/fwc26_stickerbook_cover.png",
    placeholderGradient: CATEGORY_GRADIENTS["Sticker Packs"],
    inStock: true,
    weightKg: 0.3,
  },
  {
    id: String(raw.length + 3),
    slug: "panini-fifa-world-cup-2026-official-sticker-album-hard-cover",
    name: "Panini FIFA World Cup 2026 Official Sticker Album – Hard Cover",
    category: "Collectibles",
    price: 29.99,
    description: "The premium hardcover edition of the official Panini FIFA World Cup 2026 sticker album. 112 pages with dedicated pages for all 48 national teams, stadiums, and tournament highlights. Built to last — hard cover protects your collection for years.",
    imageUrl: "/asset/stickers/hardcoveralbum.jpg",
    placeholderGradient: CATEGORY_GRADIENTS["Sticker Packs"],
    inStock: true,
    badge: "Hard Cover",
    weightKg: 0.4,
  },
  {
    id: String(raw.length + 4),
    slug: "panini-fifa-world-cup-2026-sticker-pack-single",
    name: "Panini FIFA World Cup 2026 Sticker Pack – 1 Pack",
    category: "Collectibles",
    price: 3.99,
    description: "One official Panini FIFA World Cup 2026 sticker pack. 5 stickers per pack featuring players from all 48 nations. Perfect for trying your luck or topping up your collection.",
    imageUrl: "/asset/stickers/sticker1.png",
    placeholderGradient: CATEGORY_GRADIENTS["Sticker Packs"],
    inStock: true,
    badge: "1 Pack",
    weightKg: 0.05,
  },
  {
    id: String(raw.length + 5),
    slug: "panini-fifa-world-cup-2026-starter-kit-album-10-packs",
    name: "Panini FIFA World Cup 2026 Starter Kit – Album + 10 Packs",
    category: "Collectibles",
    price: 34.99,
    comparePrice: 36.98,
    description: "Everything you need to start your collection. Official Panini sticker album plus 10 packs — 50+ stickers to kick things off. Best way to begin before kickoff.",
    imageUrl: "/asset/stickers/starterkit.jpg",
    placeholderGradient: CATEGORY_GRADIENTS["Sticker Packs"],
    inStock: true,
    badge: "Starter Kit",
    weightKg: 0.5,
  },
  {
    id: String(raw.length + 6),
    slug: "panini-fifa-world-cup-2026-bundle-hard-cover-sticker-box",
    name: "Panini FIFA World Cup 2026 Bundle – Hard Cover Album + 50-Pack Box",
    category: "Collectibles",
    price: 149.99,
    comparePrice: 154.98,
    description: "The premium collector bundle. Hard cover album built to last, paired with the full 50-Pack Sticker Box. 250+ stickers, all 48 nations. One shipment, one price.",
    imageUrl: "/asset/stickers/hardcoverbundle.png",
    placeholderGradient: CATEGORY_GRADIENTS["Sticker Packs"],
    inStock: true,
    badge: "Premium Bundle",
    weightKg: 2.2,
  },
  {
    id: String(raw.length + 7),
    slug: "panini-fifa-world-cup-2026-sticker-packs-5",
    name: "Panini FIFA World Cup 2026 Sticker Packs – 5 Packs",
    category: "Collectibles",
    price: 14.99,
    description: "Five official Panini FIFA World Cup 2026 sticker packs. 25 stickers total featuring players from all 48 nations. A great way to grow your collection without committing to a full box.",
    imageUrl: "/asset/stickers/sticker5.png",
    placeholderGradient: CATEGORY_GRADIENTS["Sticker Packs"],
    inStock: true,
    badge: "5 Packs",
    weightKg: 0.15,
  },
  {
    id: String(raw.length + 8),
    slug: "panini-fifa-world-cup-2026-sticker-packs-10",
    name: "Panini FIFA World Cup 2026 Sticker Packs – 10 Packs",
    category: "Collectibles",
    price: 27.99,
    description: "Ten official Panini FIFA World Cup 2026 sticker packs. 50 stickers total from all 48 nations. The right amount to make real progress on your album without buying a full box.",
    imageUrl: "/asset/stickers/sticker10.png",
    placeholderGradient: CATEGORY_GRADIENTS["Sticker Packs"],
    inStock: true,
    badge: "10 Packs",
    weightKg: 0.25,
  },
  {
    id: String(raw.length + 9),
    slug: "panini-fifa-world-cup-2026-sticker-packs-20",
    name: "Panini FIFA World Cup 2026 Sticker Packs – 20 Packs",
    category: "Collectibles",
    price: 52.99,
    description: "Twenty official Panini FIFA World Cup 2026 sticker packs. 100 stickers total covering all 48 nations. Serious progress on your collection — halfway to a full box.",
    imageUrl: "/asset/stickers/sticker20.png",
    placeholderGradient: CATEGORY_GRADIENTS["Sticker Packs"],
    inStock: true,
    badge: "20 Packs",
    weightKg: 0.45,
  },
  {
    id: String(raw.length + 10),
    slug: "panini-fifa-world-cup-2026-bundle-album-sticker-box",
    name: "Panini FIFA World Cup 2026 Bundle — Official Album + 50-Pack Box",
    category: "Collectibles",
    price: 129.99,
    comparePrice: 133.99,
    description: "Album + Box in one shipment — pay shipping once, not twice. The album gives you the pages, the box gives you 250+ stickers to fill them. North America's World Cup — start your collection before kickoff.",
    imageUrl: "/asset/stickers/fwc26_bundle_main.png",
    placeholderGradient: CATEGORY_GRADIENTS["Sticker Packs"],
    inStock: true,
    badge: "Bundle",
    weightKg: 1.8,
  },
];

type DbStoreProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price?: number | string | null;
  unit_price?: number | string | null;
  compare_at_price?: number | null;
  description?: string | null;
  image_url?: string | null;
  images?: Array<{ url: string; alt?: string }> | null;
  badge?: string | null;
  in_stock?: boolean | null;
  stock_qty?: number | null;
  weight_kg?: number | null;
  player_cards?: Product["playerCards"] | null;
};

function dbStoreProductToProduct(p: DbStoreProduct): Product {
  const imageUrl = p.images?.[0]?.url || p.image_url || "";
  const price = Number(p.price ?? p.unit_price ?? 0);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    price,
    comparePrice: p.compare_at_price ?? undefined,
    description: p.description ?? "",
    imageUrl,
    additionalImages: p.images?.slice(1).map((image) => image.url),
    placeholderGradient: CATEGORY_GRADIENTS[p.category] ?? "linear-gradient(145deg, #555 0%, #888 100%)",
    inStock: p.in_stock ?? p.stock_qty !== 0,
    badge: p.badge ?? undefined,
    weightKg: p.weight_kg ?? CATEGORY_WEIGHTS[p.category] ?? 0.5,
    playerCards: p.player_cards ?? undefined,
  };
}

async function getB2CDbProducts(): Promise<Product[]> {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("b2c_products")
      .select("id,slug,name,category,price,compare_at_price,description,images,badge,in_stock,stock_qty,weight_kg,player_cards")
      .eq("status", "active")
      .order("updated_at", { ascending: false });
    if (error || !data?.length) return [];
    return (data as DbStoreProduct[]).map(dbStoreProductToProduct);
  } catch {
    return [];
  }
}

// ─── Public B2C catalog accessors ────────────────────────────────────────────
// B2C and B2B use different product lists. Only products explicitly tagged for
// B2C can join this storefront; the checked-in catalog remains the fallback.

export async function getAllProducts(): Promise<Product[]> {
  const dbProducts = await getB2CDbProducts();
  if (!dbProducts.length) return staticProducts;
  const dbSlugs = new Set(dbProducts.map((product) => product.slug));
  return [...dbProducts, ...staticProducts.filter((product) => !dbSlugs.has(product.slug))];
}

export async function getProductBySlugFromDb(slug: string): Promise<Product | undefined> {
  const all = await getAllProducts();
  return all.find((p) => p.slug === slug);
}

export async function getAllSlugs(): Promise<string[]> {
  const all = await getAllProducts();
  return all.map((p) => p.slug);
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
