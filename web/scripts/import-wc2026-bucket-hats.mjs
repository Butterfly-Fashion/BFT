import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRole) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

const PRODUCTS = [
  {
    slug: "england-world-cup-2026-bucket-hat",
    name: "FIFA World Cup 2026™ We Are England Premium Bucket Hat",
    country: "England",
    imageSourceUrl: "https://soccerworldcentral.com/cdn/shop/files/B-WRN-P-1329-WE-ARE-ENGLAND-BUCKET-HAT--scaled.jpg?v=1773160735&width=1946",
    ext: "jpg",
    price: 24.99,
  },
  {
    slug: "germany-world-cup-2026-bucket-hat",
    name: "FIFA World Cup 2026™ Germany Federation Bucket Hat",
    country: "Germany",
    imageSourceUrl: "https://store.fifa.com/cdn/shop/files/0175_FIFAMH0133_1.jpg?v=1776698265&width=1946",
    ext: "jpg",
    price: 39.99,
  },
  {
    slug: "france-world-cup-2026-bucket-hat",
    name: "Nike 2026 France Reversible Bucket Hat",
    country: "France",
    imageSourceUrl: "https://www.prosoccer.com/cdn/shop/files/nike-2026-france-hollywood-keepers-reversible-bucket-hat-3289392.webp?v=1767642139&width=1946",
    ext: "webp",
    price: 29.99,
  },
  {
    slug: "brazil-world-cup-2026-bucket-hat",
    name: "Nike 2026 Brazil Reversible Bucket Hat",
    country: "Brazil",
    imageSourceUrl: "https://www.prosoccer.com/cdn/shop/files/Nike2026BrazilReversibleBucketHat_Front.webp?v=1774572691&width=1946",
    ext: "webp",
    price: 29.99,
  },
  {
    slug: "argentina-world-cup-2026-bucket-hat",
    name: "FIFA World Cup 2026™ Argentina Federation Bucket Hat",
    country: "Argentina",
    imageSourceUrl: "https://store.fifa.com/cdn/shop/files/0179_FIFAMH0132_1.jpg?v=1776698265&width=1946",
    ext: "jpg",
    price: 39.99,
  },
  {
    slug: "mexico-world-cup-2026-bucket-hat",
    name: "FIFA World Cup 2026™ Mexico Federation Bucket Hat",
    country: "Mexico",
    imageSourceUrl: "https://store.fifa.com/cdn/shop/files/0167_FIFAMH0135_1.jpg?v=1776698935&width=1946",
    ext: "jpg",
    price: 39.99,
  },
  {
    slug: "colombia-world-cup-2026-bucket-hat",
    name: "Adidas Colombia 2026 World Cup Bucket Hat",
    country: "Colombia",
    imageSourceUrl: "https://soccerworldcentral.com/cdn/shop/files/KD8513_1_HARDWARE_Photography_FrontCenterView_white.jpg?v=1778015477&width=1946",
    ext: "jpg",
    price: 34.99,
  },
  {
    slug: "portugal-world-cup-2026-bucket-hat",
    name: "FIFA World Cup 2026™ We Are Portugal Premium Bucket Hat",
    country: "Portugal",
    imageSourceUrl: "https://soccerworldcentral.com/cdn/shop/files/B-WRN-P-1338-WE-ARE-PORTUGAL-BUCKET-HAT--scaled.jpg?v=1773160654&width=1946",
    ext: "jpg",
    price: 24.99,
  },
];

async function downloadImage(url, localPath) {
  const filePath = resolve("public", localPath.replace(/^\//, ""));
  mkdirSync(dirname(filePath), { recursive: true });
  if (existsSync(filePath)) {
    console.log(`  Skipping (exists): ${localPath}`);
    return;
  }
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
      "Referer": new URL(url).origin + "/",
    },
  });
  if (!response.ok) throw new Error(`Image download failed ${response.status}: ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(filePath, buffer);
  console.log(`  Downloaded (${Math.round(buffer.length / 1024)}kb): ${localPath}`);
}

async function main() {
  const payload = [];

  for (const p of PRODUCTS) {
    const localPath = `/asset/images/caps/${p.slug}.${p.ext}`;
    console.log(`Processing: ${p.name}`);
    try {
      await downloadImage(p.imageSourceUrl, localPath);
    } catch (err) {
      console.error(`  Failed to download image: ${err.message}`);
      continue;
    }

    const skuSlug = p.slug.replace(/-/g, "").toUpperCase();
    payload.push({
      name: p.name,
      slug: p.slug,
      description: `${p.country} 2026 FIFA World Cup bucket hat for fan merchandise, event retail, and B2B bulk orders.`,
      sku: `WFG-HAT-${skuSlug}`,
      barcode: null,
      base_price: p.price,
      image_url: localPath,
      category: "Bucket Hats",
      availability_status: "Manual Confirm",
      is_bulk_available: true,
      is_hidden: false,
    });
  }

  if (!payload.length) {
    console.log("No products to insert.");
    return;
  }

  console.log(`\nUpserting ${payload.length} products to Supabase...`);
  const { error } = await supabase.from("products").upsert(payload, { onConflict: "slug" });
  if (error) throw error;

  console.log("\nDone! Inserted/updated:");
  for (const p of payload) console.log(` - ${p.name}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
