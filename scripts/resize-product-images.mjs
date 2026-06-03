/**
 * Resizes product images to max 800px wide, converts to WebP.
 * Replaces original JPGs in-place (saves as .webp alongside).
 * Run once after download-product-images.mjs.
 */

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("c:/Users/butte/codes/ecommerce-demo/web-b2c/node_modules/sharp");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_DIR = path.resolve(__dirname, "../web-b2c/public/asset/products");
const JSON_PATH = path.resolve(__dirname, "../web-b2c/lib/source-products.json");

const MAX_WIDTH = 800;

let processed = 0, skipped = 0;

async function processDir(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      await processDir(full);
      continue;
    }
    if (!/\.(jpg|jpeg|png)$/i.test(entry)) continue;

    const webpPath = full.replace(/\.(jpg|jpeg|png)$/i, ".webp");

    if (fs.existsSync(webpPath)) {
      skipped++;
      continue;
    }

    process.stdout.write(`Resizing ${path.relative(PRODUCTS_DIR, full)}... `);
    try {
      const meta = await sharp(full).metadata();
      const width = meta.width > MAX_WIDTH ? MAX_WIDTH : meta.width;
      await sharp(full)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(webpPath);

      const origSize = stat.size;
      const newSize = fs.statSync(webpPath).size;
      console.log(`${Math.round(origSize/1024)}KB → ${Math.round(newSize/1024)}KB`);
      processed++;
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
  }
}

await processDir(PRODUCTS_DIR);

// Update source-products.json: .jpg → .webp in local paths
const raw = fs.readFileSync(JSON_PATH, "utf8");
const products = JSON.parse(raw);
let updated = 0;
for (const p of products) {
  if (p.image_source_url && p.image_source_url.startsWith("/asset/products/")) {
    const newUrl = p.image_source_url.replace(/\.(jpg|jpeg|png)$/i, ".webp");
    if (newUrl !== p.image_source_url) {
      p.image_source_url = newUrl;
      updated++;
    }
  }
}
if (updated > 0) {
  fs.writeFileSync(JSON_PATH, JSON.stringify(products, null, 2) + "\n");
  console.log(`\nUpdated ${updated} paths in source-products.json`);
}

console.log(`\nDone: ${processed} processed, ${skipped} already done`);
