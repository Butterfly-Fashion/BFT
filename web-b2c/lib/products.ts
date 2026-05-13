import sourceData from "./source-products.json";
import { getB2CDescription, getB2CName } from "./product-copy";
import type { Product } from "./types";

interface RawProduct {
  slug: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  image_source_url: string;
  image_url: string;
  source?: string;
  sku?: string;
  barcode?: string | null;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  "Boxing Gloves": "linear-gradient(145deg, #8b0000 0%, #c41e3a 100%)",
  "Caps": "linear-gradient(145deg, #1a1a2e 0%, #2d4a7a 100%)",
  "Bucket Hats": "linear-gradient(145deg, #2d4a22 0%, #4a7a34 100%)",
  "Car Flags": "linear-gradient(145deg, #4a3a2d 0%, #8b6914 100%)",
  "Sticker Packs": "linear-gradient(145deg, #0d3b6e 0%, #1565c0 100%)",
};

const raw = sourceData as RawProduct[];

const STICKER_GRADIENT = CATEGORY_GRADIENTS["Sticker Packs"];

const EXTRA_PRODUCTS: Product[] = [
  {
    id: String(raw.length + 1),
    slug: "panini-fifa-world-cup-2026-sticker-box-50-packs",
    name: "Panini FIFA World Cup 2026 Sticker Box – 50 Packs",
    category: "Sticker Packs",
    price: 125,
    description:
      "The ultimate collector's haul. Each box contains 50 Panini sticker packs — over 250 stickers featuring players from all 48 nations at the FIFA World Cup 2026. Pull stars like Messi, Mbappé, Kane, Yamal, and more. Perfect for collectors, fans, and trading with friends.",
    imageUrl: "/asset/stickers/world_cup_sticker_box_50.png",
    placeholderGradient: STICKER_GRADIENT,
    inStock: true,
    badge: "50 Packs",
    playerCards: [
      { name: "Lionel Messi", imageUrl: "/asset/stickers/messi200.jpg" },
      { name: "Kylian Mbappé", imageUrl: "/asset/stickers/mbappe200.jpg" },
      { name: "Harry Kane", imageUrl: "/asset/stickers/kane200.jpg" },
      { name: "Lamine Yamal", imageUrl: "/asset/stickers/yamal200.jpg" },
      { name: "Raphinha", imageUrl: "/asset/stickers/raphinha200.jpg" },
      { name: "Virgil van Dijk", imageUrl: "/asset/stickers/vandijk200.jpg" },
      { name: "Cristian Romero", imageUrl: "/asset/stickers/romero200.jpg" },
      { name: "Pedro Porro", imageUrl: "/asset/stickers/porro200.jpg" },
      { name: "Luis Díaz", imageUrl: "/asset/stickers/diaz200.jpg" },
      { name: "Mohammed Kudus", imageUrl: "/asset/stickers/kudus200.jpg" },
      { name: "Miguel Almirón", imageUrl: "/asset/stickers/almiron200.jpg" },
      { name: "Hwang Hee-chan", imageUrl: "/asset/stickers/hwang200.jpg" },
      { name: "Abdukodir Khusanov", imageUrl: "/asset/stickers/khusanov200.jpg" },
      { name: "Édouard Mendy", imageUrl: "/asset/stickers/mendy200.jpg" },
      { name: "Ché Adams", imageUrl: "/asset/stickers/adams200.jpg" },
      { name: "Duckens Nazon", imageUrl: "/asset/stickers/nazon200.jpg" },
    ],
  },
  {
    id: String(raw.length + 2),
    slug: "panini-fifa-world-cup-2026-official-sticker-album",
    name: "Panini FIFA World Cup 2026 Official Sticker Album",
    category: "Sticker Packs",
    price: 8.99,
    description:
      "The official Panini FIFA World Cup 2026 sticker album. Features dedicated pages for all 48 teams and their squads. Pair with the 50-pack sticker box to build your complete World Cup collection. A must-have for every fan.",
    imageUrl: "/asset/stickers/fwc26_stickerbook_cover.png",
    placeholderGradient: STICKER_GRADIENT,
    inStock: true,
  },
  {
    id: String(raw.length + 3),
    slug: "panini-fifa-world-cup-2026-bundle-album-sticker-box",
    name: "Panini FIFA World Cup 2026 Bundle — Official Album + 50-Pack Box",
    category: "Sticker Packs",
    price: 130,
    description:
      "The ultimate World Cup 2026 collector's bundle. Get the Official Panini Sticker Album and the full 50-Pack Sticker Box together — over 250 stickers featuring all 48 nations, including Messi, Mbappé, Kane, Yamal, Raphinha, Van Dijk, and more. Everything you need to start and fill your 2026 collection in one package. Perfect for collectors, fans, and as a gift for kids and soccer lovers.",
    imageUrl: "/asset/stickers/fwc26_bundle_main.png",
    additionalImages: [
      "/asset/stickers/fwc26_box.png",
      "/asset/stickers/fwc26_stickerbook_cover.png",
    ],
    placeholderGradient: STICKER_GRADIENT,
    inStock: true,
    badge: "Bundle",
    playerCards: [
      { name: "Lionel Messi", imageUrl: "/asset/stickers/messi200.jpg" },
      { name: "Kylian Mbappé", imageUrl: "/asset/stickers/mbappe200.jpg" },
      { name: "Harry Kane", imageUrl: "/asset/stickers/kane200.jpg" },
      { name: "Lamine Yamal", imageUrl: "/asset/stickers/yamal200.jpg" },
      { name: "Virgil van Dijk", imageUrl: "/asset/stickers/vandijk200.jpg" },
      { name: "Hwang Hee-chan", imageUrl: "/asset/stickers/hwang200.jpg" },
    ],
  },
];

export const products: Product[] = [
  ...raw.map((p, i) => ({
    id: String(i + 1),
    slug: p.slug,
    name: getB2CName(p.name, p.category),
    category: p.category,
    price: p.base_price,
    description: getB2CDescription(p.name, p.category),
    imageUrl: p.image_source_url,
    placeholderGradient:
      CATEGORY_GRADIENTS[p.category] ??
      "linear-gradient(145deg, #555 0%, #888 100%)",
    inStock: true,
  })),
  ...EXTRA_PRODUCTS,
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  const canadaFirst = products.filter((p) =>
    p.name.toLowerCase().includes("canada")
  );
  const rest = products.filter(
    (p) => !p.name.toLowerCase().includes("canada")
  );
  return [...canadaFirst, ...rest].slice(0, 8);
}

export function getTrendingProducts(): Product[] {
  const canadaFirst = products.filter((p) =>
    p.name.toLowerCase().includes("canada")
  );
  const rest = products.filter(
    (p) => !p.name.toLowerCase().includes("canada")
  );
  return [...canadaFirst, ...rest].slice(0, 4);
}
