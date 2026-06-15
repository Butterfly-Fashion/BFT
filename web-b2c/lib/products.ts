import { supabaseAdmin } from "./supabase";
import type { Product } from "./types";
import { getB2CDescription, getB2CName } from "./product-copy";
import { SOLD_OUT_PRODUCT_SLUGS } from "./sold-out";
import { normalizeStockStatus } from "./stock-status";
import sourceData from "./source-products.json";

const CATEGORY_GRADIENTS: Record<string, string> = {
  "Fashion":      "linear-gradient(145deg, #1a1a2e 0%, #2d4a7a 100%)",
  "Collectibles": "linear-gradient(145deg, #4a2d6e 0%, #7c4aa8 100%)",
  "Accessories":  "linear-gradient(145deg, #4a3a2d 0%, #8b6914 100%)",
  "Sticker Packs": "linear-gradient(145deg, #4a2d6e 0%, #7c4aa8 100%)",
};

// Per-category shipping weights (kg) — product + typical packaging materials
// Sources: eBay/Amazon listings, Canada Post guides, manufacturer specs
const CATEGORY_WEIGHTS: Record<string, number> = {
  "Fashion":      0.25,
  "Collectibles": 0.20,
  "Accessories":  0.15,
  "Jerseys":       0.45,
  "Caps":          0.25,
  "Bucket Hats":   0.20,
  "Car Flags":     0.15,
  "Boxing Gloves": 0.15,
  "Sticker Packs": 0.50,
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

const JERSEY_SIZES = ["S", "M", "L", "XL", "2XL"];
// Kids kits use number sizing: 12, 14, … 30
const KIDS_SIZES = ["12", "14", "16", "18", "20", "22", "24", "26", "28", "30"];

const VOLUME_NOTE =
  "Buy more, pay less — set prices drop at 2, 4, and 8 sets, and any 8 sets = $199 (mix home, away, adult, and kids). Pickup today in North York or ships from Toronto.";

const FEATURED_PRODUCT_SLUGS = [
  "canada-soccer-jersey-shorts-set-2026",
  "canada-away-jersey-shorts-set-2026",
  "canada-home-kit-kids-2026",
  "canada-away-kit-kids-2026",
  "canada-game-day-kit-jersey-cap-car-flag",
  "canada-reversible-bucket-hat",
  "canada-car-flag",
  "canada-3d-embroidered-baseball-cap",
];

function withForcedStock(product: Product): Product {
  if (!SOLD_OUT_PRODUCT_SLUGS.has(product.slug)) return product;
  return { ...product, inStock: false, badge: product.badge ?? "Sold Out" };
}

function prioritizedProducts(all: Product[], slugs: string[]): Product[] {
  const picked = slugs
    .map((slug) => all.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product));
  const pickedSlugs = new Set(picked.map((product) => product.slug));
  return [...picked, ...all.filter((product) => !pickedSlugs.has(product.slug))];
}

const jerseyProducts: Product[] = [
  {
    id: "jersey-1",
    slug: "canada-soccer-jersey-shorts-set-2026",
    name: "Canada Home Kit 2026 – Red Jersey + Shorts Set (Adult)",
    category: "Jerseys",
    price: 39.99,
    description:
      `The Canada home kit for World Cup 2026 — breathable red jersey with tonal maple leaf print and black trim, plus matching shorts. Lightweight quick-dry fabric made for match days, fan zones, and Toronto summer. Adult sizes S–2XL. ${VOLUME_NOTE}`,
    imageUrl: "/asset/jersey/canada-home-kit-main.webp",
    additionalImages: [
      "/asset/jersey/canada-home-kit-detail.webp",
      "/asset/jersey/canada-kit-model.webp",
      "/asset/jersey/canada-kit-model-men.webp",
      "/asset/jersey/canada-kit-fans.webp",
    ],
    detailImage: "/asset/jersey/canada-home-kit-page.webp",
    placeholderGradient: CATEGORY_GRADIENTS["Fashion"],
    inStock: true,
    badge: "Home Kit",
    sizes: JERSEY_SIZES,
    weightKg: 0.45,
  },
  {
    id: "jersey-3",
    slug: "canada-away-jersey-shorts-set-2026",
    name: "Canada Away Kit 2026 – Black Jersey + Shorts Set (Adult)",
    category: "Jerseys",
    price: 39.99,
    description:
      `The Canada away kit for World Cup 2026 — black jersey with starfield print, red piping, and #19 DAVIES print, plus matching shorts. Same quick-dry fabric as the home kit. Adult sizes S–2XL. ${VOLUME_NOTE}`,
    imageUrl: "/asset/jersey/canada-away-kit-main.webp",
    additionalImages: ["/asset/jersey/canada-away-kit-detail.webp"],
    detailImage: "/asset/jersey/canada-away-kit-page.webp",
    placeholderGradient: CATEGORY_GRADIENTS["Fashion"],
    inStock: true,
    badge: "Away Kit · #19",
    sizes: JERSEY_SIZES,
    weightKg: 0.45,
  },
  {
    id: "jersey-4",
    slug: "canada-home-kit-kids-2026",
    name: "Canada Home Kit 2026 – Kids Red Jersey + Shorts Set",
    category: "Jerseys",
    price: 34.99,
    description:
      `The Canada home kit, sized for kids — same breathable red jersey with maple leaf print and matching shorts as the adult kit. Perfect for family match days. Kids number sizes 12–30. ${VOLUME_NOTE}`,
    imageUrl: "/asset/jersey/canada-home-kit-main.webp",
    additionalImages: [
      "/asset/jersey/canada-home-kit-detail.webp",
      "/asset/jersey/canada-kit-couple.webp",
    ],
    detailImage: "/asset/jersey/canada-home-kit-page.webp",
    placeholderGradient: CATEGORY_GRADIENTS["Fashion"],
    inStock: true,
    badge: "Kids · Home",
    sizes: KIDS_SIZES,
    weightKg: 0.35,
  },
  {
    id: "jersey-5",
    slug: "canada-away-kit-kids-2026",
    name: "Canada Away Kit 2026 – Kids Black Jersey + Shorts Set",
    category: "Jerseys",
    price: 34.99,
    description:
      `The Canada away kit, sized for kids — black starfield jersey with red piping and #19 DAVIES print, plus matching shorts. Kids number sizes 12–30. ${VOLUME_NOTE}`,
    imageUrl: "/asset/jersey/canada-away-kit-main.webp",
    additionalImages: ["/asset/jersey/canada-away-kit-detail.webp"],
    detailImage: "/asset/jersey/canada-away-kit-page.webp",
    placeholderGradient: CATEGORY_GRADIENTS["Fashion"],
    inStock: true,
    badge: "Kids · Away · #19",
    sizes: KIDS_SIZES,
    weightKg: 0.35,
  },
  {
    id: "jersey-2",
    slug: "canada-game-day-kit-jersey-cap-car-flag",
    name: "Canada Game Day Kit – Jersey Set + Cap + Car Flag",
    category: "Jerseys",
    price: 57.99,
    comparePrice: 64.97,
    description:
      "Everything you need for match day in one bundle: the Canada home jersey + shorts set, a Canada 3D embroidered cap, and a Canada car flag for the drive over. Save vs buying separately. Adult sizes S–2XL. Pickup today in North York or ships from Toronto.",
    imageUrl: "/asset/jersey/canada-kit-fans.webp",
    additionalImages: [
      "/asset/jersey/canada-home-kit-main.webp",
      "/asset/jersey/canada-kit-model.webp",
    ],
    placeholderGradient: CATEGORY_GRADIENTS["Fashion"],
    inStock: true,
    badge: "Bundle · Save $6.98",
    sizes: JERSEY_SIZES,
    weightKg: 0.75,
  },
];

const staticProducts: Product[] = [
  ...jerseyProducts,
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
    category: "Sticker Packs",
    price: 114.99,
    description: "Official Panini FIFA World Cup 2026 sealed 50-pack sticker box. Includes 350 stickers total across all 48 nations, with rare parallels possible. Pickup today in North York or ships from Toronto.",
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
    category: "Sticker Packs",
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
    category: "Sticker Packs",
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
    category: "Sticker Packs",
    price: 3.99,
    description: "One official Panini FIFA World Cup 2026 sticker pack. 7 stickers per pack featuring players from all 48 nations. Perfect for trying your luck or topping up your collection.",
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
    category: "Sticker Packs",
    price: 34.99,
    comparePrice: 36.98,
    description: "Everything you need to start your collection. Official Panini sticker album plus 10 packs — 70 stickers to kick things off. Best way to begin before kickoff.",
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
    category: "Sticker Packs",
    price: 149.99,
    comparePrice: 154.98,
    description: "The premium collector bundle. Hard cover album built to last, paired with the full 50-Pack Sticker Box. 350 stickers, all 48 nations. Pickup today or ship from Toronto.",
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
    category: "Sticker Packs",
    price: 14.99,
    description: "Five official Panini FIFA World Cup 2026 sticker packs. 35 stickers total featuring players from all 48 nations. A great way to grow your collection without committing to a full box.",
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
    category: "Sticker Packs",
    price: 27.99,
    description: "Ten official Panini FIFA World Cup 2026 sticker packs. 70 stickers total from all 48 nations. The right amount to make real progress on your album without buying a full box.",
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
    category: "Sticker Packs",
    price: 52.99,
    description: "Twenty official Panini FIFA World Cup 2026 sticker packs. 140 stickers total covering all 48 nations. Serious progress on your collection — nearly half a full box.",
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
    category: "Sticker Packs",
    price: 119.99,
    comparePrice: 123.98,
    description: "Album + Box together. The album gives you the pages, the box gives you 350 stickers to start filling them. Pickup today in North York or ships from Toronto.",
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
  stock_status?: string | null;
  weight_kg?: number | null;
  player_cards?: Product["playerCards"] | null;
};

function dbStoreProductToProduct(p: DbStoreProduct): Product {
  const imageUrl = p.images?.[0]?.url || p.image_url || "";
  const price = Number(p.price ?? p.unit_price ?? 0);
  const stockStatus = normalizeStockStatus(p.stock_status);
  const inStock = stockStatus === "sold_out" ? false : (p.in_stock ?? p.stock_qty !== 0);
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
    inStock,
    stockStatus,
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
      .select("id,slug,name,category,price,compare_at_price,description,image_url,images,badge,in_stock,stock_qty,stock_status,weight_kg,player_cards")
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
  if (!dbProducts.length) return staticProducts.map(withForcedStock);
  const dbSlugs = new Set(dbProducts.map((product) => product.slug));
  return [...dbProducts, ...staticProducts.filter((product) => !dbSlugs.has(product.slug))]
    .map(withForcedStock);
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
  const all = (await getAllProducts()).filter((product) => product.inStock);
  return prioritizedProducts(all, FEATURED_PRODUCT_SLUGS).slice(0, 8);
}

export async function getTrendingProducts(): Promise<Product[]> {
  const all = (await getAllProducts()).filter((product) => product.inStock);
  const priority = [
    "canada-soccer-jersey-shorts-set-2026",
    "canada-away-jersey-shorts-set-2026",
    "canada-home-kit-kids-2026",
    "canada-away-kit-kids-2026",
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

export const products: Product[] = staticProducts.map(withForcedStock);
