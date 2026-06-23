// Import B2C soccer products (Caps, Car Flags, Jerseys) into the shared B2B catalog.
// - Caps $7.49, Car Flags $4.99, Jerseys $19.99 (unit_price only; case fields left blank)
// - Excludes Boxing Gloves, Bucket Hats, Sticker Packs, and the mixed "Game Day Kit" bundle.
// - Creates b2b_categories: "Soccer" (root) > "Soccer Jerseys" / "Soccer Caps" / "Soccer Car Flags".
// - Copies product images from web-b2c/public to web-b2b/public (same paths).
//
// Run from web-b2b/:  node scripts/import-soccer-products.mjs

import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, copyFileSync, readFileSync } from "node:fs";
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

const B2C_PUBLIC = resolve(process.cwd(), "../web-b2c/public");
const B2B_PUBLIC = resolve(process.cwd(), "public");
const SOURCE_JSON = resolve(process.cwd(), "../web-b2c/lib/source-products.json");

// ─── Category definitions ────────────────────────────────────────────────────
const ROOT = { name: "Soccer", slug: "soccer", sort_order: 100 };
const CHILDREN = [
  { name: "Soccer Jerseys", slug: "soccer-jerseys", sort_order: 1 },
  { name: "Soccer Caps", slug: "soccer-caps", sort_order: 2 },
  { name: "Soccer Car Flags", slug: "soccer-car-flags", sort_order: 3 },
];

// Per-category unit price + SKU prefix, keyed by the B2C source category.
const RULES = {
  Caps: { category: "Soccer Caps", unitPrice: 7.49, skuPrefix: "CAP" },
  "Car Flags": { category: "Soccer Car Flags", unitPrice: 4.99, skuPrefix: "FLAG" },
};

// Jerseys (the mixed "Game Day Kit" bundle is intentionally excluded).
const JERSEYS = [
  {
    slug: "canada-soccer-jersey-shorts-set-2026",
    name: "Canada Home Kit 2026 – Red Jersey + Shorts Set (Adult)",
    image: "/asset/jersey/canada-home-kit-main.webp",
  },
  {
    slug: "canada-away-jersey-shorts-set-2026",
    name: "Canada Away Kit 2026 – Black Jersey + Shorts Set (Adult)",
    image: "/asset/jersey/canada-away-kit-main.webp",
  },
  {
    slug: "canada-home-kit-kids-2026",
    name: "Canada Home Kit 2026 – Kids Red Jersey + Shorts Set",
    image: "/asset/jersey/canada-home-kit-main.webp",
  },
  {
    slug: "canada-away-kit-kids-2026",
    name: "Canada Away Kit 2026 – Kids Black Jersey + Shorts Set",
    image: "/asset/jersey/canada-away-kit-main.webp",
  },
];

function copyImage(relPath) {
  if (!relPath) return false;
  const from = resolve(B2C_PUBLIC, relPath.replace(/^\//, ""));
  const to = resolve(B2B_PUBLIC, relPath.replace(/^\//, ""));
  if (!existsSync(from)) {
    console.warn(`  ! missing source image, skipping copy: ${relPath}`);
    return false;
  }
  if (existsSync(to)) return true;
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  return true;
}

function skuFor(prefix, slug) {
  return `WFG-${prefix}-${slug.replace(/-/g, "").toUpperCase().slice(0, 28)}`;
}

async function upsertCategories() {
  // Root first, then children (need root id for parent_id).
  const { data: rootRow, error: rootErr } = await supabase
    .from("b2b_categories")
    .upsert({ ...ROOT, is_active: true }, { onConflict: "slug" })
    .select("id, name, slug")
    .single();
  if (rootErr) throw rootErr;

  const childRows = CHILDREN.map((c) => ({ ...c, parent_id: rootRow.id, is_active: true }));
  const { error: childErr } = await supabase
    .from("b2b_categories")
    .upsert(childRows, { onConflict: "slug" });
  if (childErr) throw childErr;

  console.log(`Categories ready: ${ROOT.name} > ${CHILDREN.map((c) => c.name).join(", ")}`);
}

function buildPayload() {
  const raw = JSON.parse(readFileSync(SOURCE_JSON, "utf8"));
  const payload = [];

  for (const p of raw) {
    const rule = RULES[p.category];
    if (!rule) continue; // skips Boxing Gloves, Bucket Hats, etc.
    copyImage(p.image_source_url);
    payload.push({
      name: p.name,
      slug: p.slug,
      description: p.description,
      sku: p.sku || skuFor(rule.skuPrefix, p.slug),
      barcode: p.barcode ?? null,
      unit_price: rule.unitPrice,
      price: rule.unitPrice,
      case_price: null,
      case_qty: null,
      image_url: p.image_source_url,
      category: rule.category,
      sales_channels: ["b2b"],
      status: "active",
      availability_status: "Manual Confirm",
      is_bulk_available: true,
      is_hidden: false,
    });
  }

  for (const j of JERSEYS) {
    copyImage(j.image);
    payload.push({
      name: j.name,
      slug: j.slug,
      description: `${j.name} — Canada 2026 fan kit for event retail and B2B bulk orders. Wholesale pricing available.`,
      sku: skuFor("JER", j.slug),
      barcode: null,
      unit_price: 19.99,
      price: 19.99,
      case_price: null,
      case_qty: null,
      image_url: j.image,
      category: "Soccer Jerseys",
      sales_channels: ["b2b"],
      status: "active",
      availability_status: "Manual Confirm",
      is_bulk_available: true,
      is_hidden: false,
    });
  }

  return payload;
}

async function main() {
  await upsertCategories();

  const payload = buildPayload();
  if (!payload.length) {
    console.log("No products to insert.");
    return;
  }

  console.log(`Upserting ${payload.length} products...`);
  const { error } = await supabase.from("products").upsert(payload, { onConflict: "slug" });
  if (error) throw error;

  const counts = payload.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  console.log("Done. By category:", counts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
