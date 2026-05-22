import { getAllProducts } from "@/lib/products";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

const GOOGLE_CATEGORY: Record<string, string> = {
  "Boxing Gloves": "Sporting Goods > Boxing & Martial Arts > Boxing Equipment > Boxing Gloves",
  "Caps": "Apparel & Accessories > Clothing Accessories > Hats",
  "Bucket Hats": "Apparel & Accessories > Clothing Accessories > Hats",
  "Car Flags": "Vehicles & Parts > Vehicle Accessories > Vehicle Decor > Vehicle Flags & Pennants",
  "Sticker Packs": "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Stickers",
};

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
  const site = SITE_URL.replace(/\/$/, "");

  const items = products
    .filter((p) => p.inStock && p.imageUrl)
    .map((p) => {
      const price = p.price.toFixed(2);
      const comparePrice = p.comparePrice ? p.comparePrice.toFixed(2) : null;
      const description = escapeXml(
        p.description || `${p.name} — Canada 2026 World Cup fan gear. Shipped from Toronto, Canada.`
      );
      const googleCat = GOOGLE_CATEGORY[p.category] ?? "Sporting Goods";
      const imageUrl = p.imageUrl.startsWith("http") ? p.imageUrl : `${site}${p.imageUrl}`;

      return `
    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${description}</g:description>
      <g:link>${site}/products/${escapeXml(p.slug)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${price} CAD</g:price>${
        comparePrice
          ? `\n      <g:sale_price>${price} CAD</g:sale_price>\n      <g:original_price>${comparePrice} CAD</g:original_price>`
          : ""
      }
      <g:brand>World Fan Gear</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>${escapeXml(googleCat)}</g:google_product_category>
      <g:product_type>${escapeXml(p.category)}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>CA</g:country>
        <g:service>Standard</g:service>
      </g:shipping>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>World Fan Gear — Canada 2026 Fan Merchandise</title>
    <link>${site}</link>
    <description>Canada 2026 World Cup fan gear — caps, bucket hats, car flags, boxing gloves. Shipped from Toronto.</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
