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
};

const raw = sourceData as RawProduct[];

export const products: Product[] = raw.map((p, i) => ({
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
}));

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
