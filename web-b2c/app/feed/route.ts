import { getAllProducts } from "@/lib/products";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fifa2026.ca";
const BRAND = "World Fan Gear";

// Google product category IDs
const CATEGORY_MAP: Record<string, string> = {
  Collectibles: "Toys & Games > Collectible Toys > Trading Cards",
  "Sticker Packs": "Toys & Games > Collectible Toys > Trading Cards",
  Fashion: "Apparel & Accessories > Clothing Accessories > Hats",
  Jerseys: "Apparel & Accessories > Clothing > Shirts & Tops",
  Accessories: "Sporting Goods > Athletics > Sports Fan Accessories",
  Caps: "Apparel & Accessories > Clothing Accessories > Hats",
  "Bucket Hats": "Apparel & Accessories > Clothing Accessories > Hats",
  "Car Flags": "Sporting Goods > Athletics > Sports Fan Accessories",
  "Boxing Gloves": "Sporting Goods > Athletics > Sports Fan Accessories",
};

function absoluteImage(url: string): string {
  if (url.startsWith("http")) return url;
  return `${SITE}${url.startsWith("/") ? "" : "/"}${url}`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const products = await getAllProducts();
  const inStock = products.filter((p) => p.inStock);

  const items = inStock
    .map((p) => {
      const price = p.price.toFixed(2);
      const imageUrl = absoluteImage(p.imageUrl);
      const productUrl = `${SITE}/products/${p.slug}`;
      const category = CATEGORY_MAP[p.category] ?? "Sporting Goods > Athletics > Sports Fan Accessories";

      return `
  <item>
    <g:id>${escapeXml(p.slug)}</g:id>
    <g:title>${escapeXml(p.name)}</g:title>
    <g:description>${escapeXml(p.description)}</g:description>
    <g:link>${productUrl}</g:link>
    <g:image_link>${escapeXml(imageUrl)}</g:image_link>
    <g:price>${price} CAD</g:price>
    <g:availability>in stock</g:availability>
    <g:condition>new</g:condition>
    <g:brand>${BRAND}</g:brand>
    <g:google_product_category>${escapeXml(category)}</g:google_product_category>
    <g:shipping>
      <g:country>CA</g:country>
      <g:service>Standard</g:service>
      <g:price>0 CAD</g:price>
    </g:shipping>${p.comparePrice ? `\n    <g:sale_price>${price} CAD</g:sale_price>` : ""}
  </item>`.trim();
    })
    .join("\n  ");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${BRAND}</title>
    <link>${SITE}</link>
    <description>FIFA World Cup 2026 fan gear and collectibles — ships from Toronto, Canada.</description>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
