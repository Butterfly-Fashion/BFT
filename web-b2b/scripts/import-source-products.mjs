import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const userAgent = "Mozilla/5.0";

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function cleanName(value) {
  return value.replaceAll("&quot;", '"').replaceAll("&amp;", "&").replace(/\s+/g, " ").trim();
}

function localImagePath(category, slug) {
  return `/asset/images/${category}/${slug}.jpg`;
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": userAgent } });
  if (!response.ok) throw new Error(`Fetch failed ${response.status}: ${url}`);
  return response.text();
}

async function downloadImage(url, publicPath) {
  const filePath = resolve("public", publicPath.replace(/^\//, ""));
  mkdirSync(dirname(filePath), { recursive: true });
  if (existsSync(filePath)) return;

  const response = await fetch(url, { headers: { "user-agent": userAgent } });
  if (!response.ok) throw new Error(`Image failed ${response.status}: ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(filePath, buffer);
}

function parseWixGallery(html, category, defaultPrice) {
  const chunks = html.split('<li data-hook="product-list-grid-item">').slice(1);
  const items = [];

  for (const chunk of chunks) {
    const slug = chunk.match(/data-slug="([^"]+)"/)?.[1];
    const rawName = chunk.match(/aria-label="([^"]+) gallery"/)?.[1];
    const rawInfo = chunk.match(/data-image-info="([^"]+)"/)?.[1];
    if (!slug || !rawName || !rawInfo) continue;

    let imageUrl = "";
    try {
      const info = JSON.parse(rawInfo.replaceAll("&quot;", '"').replaceAll("&amp;", "&"));
      imageUrl = info.imageData?.uri || "";
      if (imageUrl && !imageUrl.startsWith("http")) imageUrl = `https://static.wixstatic.com/media/${imageUrl}`;
    } catch {
      imageUrl = "";
    }

    const price = [...chunk.matchAll(/C\$\s*([0-9]+(?:\.[0-9]{2})?)/g)].map((match) => match[1])[0] || defaultPrice;
    items.push({
      slug,
      name: cleanName(rawName),
      description: `${cleanName(rawName)} for fan merchandise, event retail, and B2B bulk orders.`,
      category,
      base_price: Number(price),
      image_source_url: imageUrl,
      image_url: localImagePath(category, slug),
      source: "fifa2026.ca",
    });
  }

  return items;
}

async function scrapeFifaProducts() {
  const products = [];

  for (let page = 1; page <= 5; page += 1) {
    const url = `https://www.fifa2026.ca/sale-and-offers${page === 1 ? "" : `?page=${page}`}`;
    const html = await fetchText(url);
    products.push(...parseWixGallery(html, "Caps", "19.99"));
  }

  const gloveHtml = await fetchText("https://www.fifa2026.ca/shop-6");
  products.push(...parseWixGallery(gloveHtml, "Boxing Gloves", "12.99"));

  return products;
}

async function scrapeSportsCollection(collectionHandle, category, localFolder, skuPrefix, defaultPrice) {
  const url = `https://sportsunitedofficial.com/collections/${collectionHandle}/products.json?limit=250`;
  const response = await fetch(url, { headers: { "user-agent": userAgent } });
  if (!response.ok) throw new Error(`Sports United ${collectionHandle} failed ${response.status}`);
  const json = await response.json();

  return (json.products || []).map((product) => {
    const variant = product.variants?.[0] || {};
    const slug = slugify(product.title);
    return {
      slug,
      name: product.title,
      description: product.body_html?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || `${product.title} for event and wholesale orders.`,
      category,
      base_price: Number(variant.price || defaultPrice),
      sku: `${skuPrefix}-${slug.toUpperCase().slice(0, 24)}`,
      barcode: variant.barcode || null,
      image_source_url: product.images?.[0]?.src || product.image?.src || "",
      image_url: localImagePath(localFolder, slug),
      source: "sportsunitedofficial.com",
    };
  });
}

async function scrapeSportsFlags() {
  return scrapeSportsCollection("flags-auto", "Car Flags", "car-flags", "SU-FLAG", "11.99");
}

async function scrapeBucketHats() {
  return scrapeSportsCollection("bucket-hats", "Bucket Hats", "caps", "SU-HAT", "19.99");
}

async function main() {
  const productsBySlug = new Map();
  for (const product of [...(await scrapeFifaProducts()), ...(await scrapeSportsFlags()), ...(await scrapeBucketHats())]) {
    productsBySlug.set(product.slug, product);
  }

  const products = [...productsBySlug.values()].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  const payload = [];

  for (const [index, product] of products.entries()) {
    if (product.image_source_url) await downloadImage(product.image_source_url, product.image_url);
    const skuSlug = product.slug.replace(/-/g, "").toUpperCase();
    const skuPrefix =
      product.category === "Caps"
        ? "CAP"
        : product.category === "Bucket Hats"
          ? "HAT"
          : product.category === "Boxing Gloves"
            ? "BG"
            : "PROD";
    payload.push({
      name: product.name,
      slug: product.slug,
      description: product.description,
      sku: product.sku || `WFG-${skuPrefix}-${skuSlug}`,
      barcode: product.barcode || `SRC-${String(index + 1).padStart(8, "0")}`,
      base_price: product.base_price,
      image_url: product.image_url,
      category: product.category,
      availability_status: "Manual Confirm",
      is_bulk_available: true,
      is_hidden: false,
    });
  }

  const { error } = await supabase.from("products").upsert(payload, { onConflict: "slug" });
  if (error) throw error;

  mkdirSync(resolve("public/asset/manifests"), { recursive: true });
  writeFileSync(resolve("public/asset/manifests/source-products.json"), JSON.stringify(products, null, 2));

  const counts = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});

  console.log("Imported products:", products.length);
  console.log(counts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
