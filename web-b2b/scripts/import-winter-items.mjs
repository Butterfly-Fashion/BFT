/**
 * Import winter item products + pre-order campaigns to Supabase.
 *
 * Run from web-b2b/:
 *   node scripts/import-winter-items.mjs
 *
 * Images are copied from:
 *   C:\Users\butte\Desktop\상품사진\winter item\product\
 * to:
 *   public/asset/images/winter/
 */

import { createClient } from "@supabase/supabase-js";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// ── env ──────────────────────────────────────────────────────────────────────
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const idx = t.indexOf("=");
    const key = t.slice(0, idx);
    const val = t.slice(idx + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRole) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

// ── image paths ───────────────────────────────────────────────────────────────
const IMAGE_SRC_DIR = "C:\\Users\\butte\\Desktop\\상품사진\\winter item\\product";
const GROUP_SRC_DIR = "C:\\Users\\butte\\Desktop\\상품사진\\winter item\\group";
const IMAGE_DST_DIR = resolve(process.cwd(), "public/asset/images/winter");

mkdirSync(IMAGE_DST_DIR, { recursive: true });

// Special cases: SV1330 → group7.jpg, SV1331 → "group 6.jpg"
const GROUP_IMAGE_MAP = {
  "SV1330_group.jpg": "group7.jpg",
  "SV1331_group.jpg": "group 6.jpg",
};

function copyImage(srcFile, dstName) {
  if (!srcFile) return null;

  const isGroupAlias = srcFile in GROUP_IMAGE_MAP;
  const actualSrc = isGroupAlias ? GROUP_IMAGE_MAP[srcFile] : srcFile;
  const srcDir = isGroupAlias ? GROUP_SRC_DIR : IMAGE_SRC_DIR;
  const srcPath = resolve(srcDir, actualSrc);
  const ext = actualSrc.endsWith(".png") ? "png" : "jpg";
  const dstPath = resolve(IMAGE_DST_DIR, `${dstName}.${ext}`);

  if (!existsSync(srcPath)) {
    console.warn(`  ⚠ Image not found: ${srcPath}`);
    return null;
  }
  copyFileSync(srcPath, dstPath);
  return `/asset/images/winter/${dstName}.${ext}`;
}

function slugify(sku) {
  return sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── product catalog ───────────────────────────────────────────────────────────
// unit_price = per-piece price when buying a dozen
// case_qty = 12 (1 dozen)
// case_price = unit_price × 12 (total per case)

const CATALOG = [
  // Winter Hats ───────────────────────────────────────────────────────────────
  { sku: "WMK-22",    name: "3 Holes Balaclava Hat — Black",                  description: "3 holes hat, black color. Packing: Dozen.",                                                                                                                      category: "Winter Hats",   unit_price: 2.99,  imageFile: "WMK-22.png" },
  { sku: "WH-NECK-1", name: "Hair Band — Black 19×11cm",                      description: "19×11cm hair band, black color. Packing: Dozen.",                                                                                                                 category: "Winter Hats",   unit_price: 1.49,  imageFile: "WH-NECK1.png" },
  { sku: "WH-CA",     name: "Maple Leaf Toque — Black",                        description: "Maple leaf hat, black color. Packing: Dozen.",                                                                                                                    category: "Winter Hats",   unit_price: 2.99,  imageFile: "WH-CA.png" },
  { sku: "WH-AR",     name: "Army Color Toque",                                description: "Army color hat. Packing: Dozen.",                                                                                                                                  category: "Winter Hats",   unit_price: 2.99,  imageFile: "WH-AR.png" },
  { sku: "WH-1",      name: "Plain Toque — Black",                             description: "Plain hat, black color. Packing: Dozen.",                                                                                                                          category: "Winter Hats",   unit_price: 2.49,  imageFile: "WH-1.png" },
  { sku: "WMK-22-A",  name: "Army Color 3 Holes Balaclava Hat",               description: "Army color 3 holes hat. Packing: Dozen.",                                                                                                                         category: "Winter Hats",   unit_price: 2.99,  imageFile: "WMK-22-A.png" },
  { sku: "WH-NECK-2", name: "Neck Scarf — Black 19×22cm",                     description: "19×22cm neck scarf, black color. Packing: Dozen.",                                                                                                                category: "Winter Hats",   unit_price: 2.99,  imageFile: "WH-NECK-2.png" },
  { sku: "JK-021",    name: "Ladies Pom-Pom Hat — Assorted Colors",           description: "Lady hat assorted colors: black ×6, pink ×1, white ×1, wine ×1, grey ×1, dark blue ×1, army green ×1. Packing: Dozen.",                                        category: "Winter Hats",   unit_price: 5.99,  imageFile: "JK-021.png" },
  { sku: "WH-AH",     name: "Army Ear-Flap Hat with Fur",                     description: "Winter hat, army color. Army Ear-Flap Hat with Fur. Packing: Dozen.",                                                                                             category: "Winter Hats",   unit_price: 9.99,  imageFile: "WH-AH.png" },
  { sku: "WH-LET",    name: "Leather Hunter's Hat with Fur",                  description: "High quality leather buckle hat. Leather hunter's hat with fur. Packing: Dozen.",                                                                                  category: "Winter Hats",   unit_price: 19.99, imageFile: "WH-LET.png" },
  { sku: "WH-MASK3",  name: "Quilting Fur Hat with Winter Mask — Unisex",     description: "Quilting fur hat with integrated winter mask (Unisex). Packing: Dozen.",                                                                                           category: "Winter Hats",   unit_price: 9.99,  imageFile: "WH-MASK3.png" },
  { sku: "72006",     name: "Double Lined Hunter Hat",                         description: "Double lined hunter hats. Packing: Dozen.",                                                                                                                        category: "Winter Hats",   unit_price: 9.99,  imageFile: "72006.png" },
  { sku: "53759",     name: "Ear Muff — One Size",                             description: "One size ear muff. Packing: Dozen.",                                                                                                                               category: "Winter Hats",   unit_price: 0.99,  imageFile: "53759.png" },
  { sku: "SV1330",    name: "Short Plain Beanie — 21 Colors",                 description: "Basic Short Plain Beanie. 100% Acrylic, One Size. Available in 21 colors: Charcoal, Royal, Hot Pink, Brown, Navy, Kelly Green, Red, Ash Gray, Burgundy, Sky Blue, Khaki, Lt Pink, Hunter Green, Timber, Orange, Yellow, Purple, White, Olive, Turquoise, Black. Sold by color, packing: Dozen.", category: "Winter Hats", unit_price: 2.99, imageFile: "SV1330_group.jpg" },
  { sku: "SV1331",    name: "Basic Cuffed Toque — 24 Colors",                 description: "Basic Cuffed Colourful Toque. 100% Acrylic, One Size. Available in 24 colors: Ash Gray, Olive, Burgundy, Neon Yellow, Purple, White, Gold, Orange, Charcoal, Hunter Green, Red, Neon Green, Lt Pink, Khaki, Black, Navy, Kelly Green, Hot Pink, Royal, Camo Green, Neon Hot Pink, Neon Orange, Timber, Turquoise. Sold by color, packing: Dozen.", category: "Winter Hats", unit_price: 2.99, imageFile: "SV1331_group.jpg" },

  // Winter Gloves ─────────────────────────────────────────────────────────────
  { sku: "WMG-20",    name: "Women's Touch Screen Gloves — Black 32g",        description: "Black magic glove with touch screen finger, woman size, black color, 32g. Packing: Dozen.",                                                                       category: "Winter Gloves", unit_price: 1.25,  imageFile: "WMG-20.png" },
  { sku: "WMG-22",    name: "Men's Touch Screen Gloves — Black 39g",          description: "Black magic glove with touch screen finger, man size, black color, 39g. Packing: Dozen.",                                                                          category: "Winter Gloves", unit_price: 1.49,  imageFile: "WMG-22.png" },
  { sku: "WMG-19",    name: "Men's Basic Gloves — Black 52g",                 description: "Black glove for man, 52g, no touch screen finger. Packing: Dozen.",                                                                                               category: "Winter Gloves", unit_price: 1.99,  imageFile: "WMG-19.png" },
  { sku: "52225",     name: "Men's Touch Screen Gloves — Mixed (Black+Grey)", description: "Man glove with touch screen finger, black 10prs + grey 2prs per dozen. Packing: Dozen.",                                                                          category: "Winter Gloves", unit_price: 1.49,  imageFile: "52225.png" },
  { sku: "52229",     name: "Men's Touch Screen Gloves — Mixed Thick",        description: "Man glove with touch screen finger, black 10prs + grey 2prs per dozen (thicker). Packing: Dozen.",                                                                 category: "Winter Gloves", unit_price: 1.99,  imageFile: "52229.png" },
  { sku: "WRG-55",    name: "Men's Gloves with Leather Tag — Black",          description: "Man glove with leather tag, black color. Packing: Dozen.",                                                                                                         category: "Winter Gloves", unit_price: 3.49,  imageFile: "WRG-55.png" },
  { sku: "WG-28",     name: "Basic Ski Gloves",                               description: "Basic Ski Gloves. Packing: Dozen.",                                                                                                                                category: "Winter Gloves", unit_price: 3.99,  imageFile: "WG-28.png" },
  { sku: "53979",     name: "Men's Gloves with Grips",                        description: "Gloves with grips for men. Packing: Dozen.",                                                                                                                        category: "Winter Gloves", unit_price: 3.99,  imageFile: "53979.png" },
  { sku: "WSG-02",    name: "Baby Ski Mitten",                                description: "Baby Ski Mitten. Packing: Dozen.",                                                                                                                                  category: "Winter Gloves", unit_price: 3.49,  imageFile: "WSG-02.png" },
  { sku: "WSG-04",    name: "Children's Ski Gloves",                          description: "Children's Ski Gloves. Packing: Dozen.",                                                                                                                            category: "Winter Gloves", unit_price: 3.99,  imageFile: "WSG-04.png" },
  { sku: "WSG-08",    name: "Children's Canadian Ski Gloves",                 description: "Children's Canadian Ski Gloves. Packing: Dozen.",                                                                                                                   category: "Winter Gloves", unit_price: 4.49,  imageFile: "WSG-08.png" },
  { sku: "WSG-13",    name: "Men's Fleece Gloves",                            description: "Men's fleece gloves. Packing: Dozen.",                                                                                                                              category: "Winter Gloves", unit_price: 3.99,  imageFile: "WSG-13.png" },
  { sku: "WSG-14",    name: "Army Ski Gloves",                                description: "Army ski gloves. Packing: Dozen.",                                                                                                                                  category: "Winter Gloves", unit_price: 3.99,  imageFile: "WSG-14.png" },
  { sku: "WSG-16-1",  name: "Army Waterproof Ski Gloves — L/XL",             description: "L-M / XL-L Army Water-Proof Ski gloves. Packing: Dozen.",                                                                                                          category: "Winter Gloves", unit_price: 7.50,  imageFile: "WSG-16-1.png" },
  { sku: "WG-26",     name: "Ladies Ski Gloves",                              description: "Ladies Ski Gloves. Packing: Dozen.",                                                                                                                                category: "Winter Gloves", unit_price: 3.99,  imageFile: "WG-26.png" },
  { sku: "53990",     name: "Ladies Gloves with Lace Detail",                 description: "Ladies gloves with lace detail. Packing: Dozen.",                                                                                                                   category: "Winter Gloves", unit_price: 3.99,  imageFile: "53990.png" },
  { sku: "WG-06",     name: "Men's Winter Gloves with Patterns",              description: "Men's winter gloves with patterns. Packing: Dozen.",                                                                                                                 category: "Winter Gloves", unit_price: 3.99,  imageFile: "WG-06.png" },
  { sku: "WG-10",     name: "Fleece Gloves",                                  description: "Fleece gloves. Packing: Dozen.",                                                                                                                                    category: "Winter Gloves", unit_price: 1.25,  imageFile: "WG-10.png" },

  // Winter Masks ──────────────────────────────────────────────────────────────
  { sku: "TOP-GUN",   name: "KX Full Face Motor Mask — Black",                description: "KX whole protecting motor mask, black color. Packing: Dozen.",                                                                                                     category: "Winter Masks",  unit_price: 2.99,  imageFile: "TOP-GUN.png" },
  { sku: "MZ-02-2",   name: "Balaclava Sponge Mask — Black Small",           description: "Balaclava sponge mask, ALL BLACK SMALL. Packing: Dozen.",                                                                                                          category: "Winter Masks",  unit_price: 1.99,  imageFile: "MZ-02-1.png" },
  { sku: "MZ-02-1",   name: "Balaclava Sponge Mask — Army Small",            description: "Balaclava sponge mask, ALL ARMY SMALL. Packing: Dozen.",                                                                                                           category: "Winter Masks",  unit_price: 1.99,  imageFile: "MZ-02-1.png" },
  { sku: "MZ-01-2",   name: "Sponge Mask — Black Large",                     description: "Sponge mask, black large. Packing: Dozen.",                                                                                                                         category: "Winter Masks",  unit_price: 2.49,  imageFile: "MZ-01-2.png" },
  { sku: "MZ-01-1",   name: "Sponge Mask — Army Large",                      description: "Sponge mask, army large. Packing: Dozen.",                                                                                                                          category: "Winter Masks",  unit_price: 2.49,  imageFile: "MZ-01-1.png" },
  { sku: "LT-1811",   name: "Winter Full Face Mask",                          description: "Winter Full Face Mask. Available in Grey, Red, Blue, Black. Packing: Dozen.",                                                                                       category: "Winter Masks",  unit_price: 2.99,  imageFile: null },
  { sku: "WH-MASK",   name: "M1 Mask",                                        description: "M1 Mask. Packing: Dozen.",                                                                                                                                          category: "Winter Masks",  unit_price: 0.49,  imageFile: "WH-MASK.png" },
];

const CASE_QTY = 12;

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Winter Items Import ===\n");

  // 1. Copy images
  console.log("Step 1: Copying product images...");
  const imageUrlMap = {};
  for (const p of CATALOG) {
    const slug = slugify(p.sku);
    if (!p.imageFile) {
      console.log(`  – ${p.sku}: no image`);
      imageUrlMap[p.sku] = null;
      continue;
    }
    const url = copyImage(p.imageFile, slug);
    imageUrlMap[p.sku] = url;
    console.log(`  ${url ? "✓" : "✗"} ${p.sku} → ${url || "MISSING"}`);
  }

  // 2. Upsert products
  console.log("\nStep 2: Upserting products to Supabase...");
  const productPayload = CATALOG.map((p) => ({
    name: p.name,
    slug: slugify(p.sku),
    description: p.description,
    sku: p.sku,
    price: p.unit_price,
    unit_price: p.unit_price,
    case_price: parseFloat((p.unit_price * CASE_QTY).toFixed(2)),
    case_qty: CASE_QTY,
    image_url: imageUrlMap[p.sku] || null,
    category: p.category,
    availability_status: "Manual Confirm",
    is_bulk_available: true,
    is_hidden: false,
    sales_channels: ["b2b"],
  }));

  const { error: prodError } = await supabase.from("products").upsert(productPayload, { onConflict: "slug" });
  if (prodError) throw prodError;
  console.log(`  ✓ ${productPayload.length} products upserted`);

  // 3. Fetch inserted products to get their IDs
  console.log("\nStep 3: Fetching product IDs...");
  const skus = CATALOG.map((p) => p.sku);
  const { data: insertedProducts, error: fetchError } = await supabase
    .from("products")
    .select("id, sku, name, unit_price, case_price, case_qty")
    .in("sku", skus);
  if (fetchError) throw fetchError;

  const productBySkuMap = Object.fromEntries(insertedProducts.map((p) => [p.sku, p]));

  // 4. Upsert pre-order campaigns
  console.log("\nStep 4: Creating pre-order campaigns...");
  const campaignPayload = [];
  for (const p of CATALOG) {
    const prod = productBySkuMap[p.sku];
    if (!prod) {
      console.warn(`  ⚠ Product not found for SKU: ${p.sku}`);
      continue;
    }

    // Check if campaign already exists for this product
    const { data: existing } = await supabase
      .from("preorder_campaigns")
      .select("id")
      .eq("product_id", prod.id)
      .eq("status", "open")
      .maybeSingle();

    if (existing) {
      console.log(`  – ${p.sku}: campaign already exists, skipping`);
      continue;
    }

    campaignPayload.push({
      product_id: prod.id,
      title: `${prod.name} — Pre-order`,
      description: `Pre-order for ${prod.name}. ${p.description} Minimum order: 1 dozen (12 pcs) = $${prod.case_price?.toFixed(2)} per case. Unit price: $${prod.unit_price?.toFixed(2)}/pc.`,
      unit_price: prod.unit_price,
      case_price: prod.case_price,
      case_qty: prod.case_qty,
      status: "open",
    });
  }

  if (campaignPayload.length === 0) {
    console.log("  No new campaigns to create (all already exist).");
  } else {
    const { error: campError } = await supabase.from("preorder_campaigns").insert(campaignPayload);
    if (campError) throw campError;
    console.log(`  ✓ ${campaignPayload.length} pre-order campaigns created`);
  }

  // Summary
  console.log("\n=== Done ===");
  console.log(`Products:  ${productPayload.length}`);
  console.log(`Campaigns: ${campaignPayload.length} new`);
  console.log("\nCategories:");
  const catCounts = CATALOG.reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + 1; return acc; }, {});
  for (const [cat, count] of Object.entries(catCounts)) console.log(`  ${cat}: ${count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
