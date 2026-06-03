/**
 * Downloads all external product images (Wixstatic + Shopify CDN) to
 * web-b2c/public/asset/products/{category-slug}/{product-slug}.jpg
 * and rewrites image_source_url in source-products.json to local paths.
 */

import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const JSON_PATH = path.join(ROOT, "web-b2c/lib/source-products.json");
const PUBLIC_DIR = path.join(ROOT, "web-b2c/public/asset/products");

const CATEGORY_DIR = {
  "Boxing Gloves": "boxing-gloves",
  "Caps": "caps",
  "Bucket Hats": "bucket-hats",
  "Car Flags": "car-flags",
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    });
    req.on("error", (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const raw = fs.readFileSync(JSON_PATH, "utf8");
const products = JSON.parse(raw);

let downloaded = 0;
let skipped = 0;
let failed = 0;
const failures = [];

for (const p of products) {
  const srcUrl = p.image_source_url;
  if (!srcUrl || srcUrl.startsWith("/")) {
    skipped++;
    continue;
  }

  const catDir = CATEGORY_DIR[p.category];
  if (!catDir) {
    console.warn(`Unknown category: ${p.category} (${p.slug})`);
    skipped++;
    continue;
  }

  const ext = srcUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)?.[1]?.toLowerCase() ?? "jpg";
  const filename = `${p.slug}.${ext}`;
  const destDir = path.join(PUBLIC_DIR, catDir);
  const destPath = path.join(destDir, filename);
  const localPath = `/asset/products/${catDir}/${filename}`;

  fs.mkdirSync(destDir, { recursive: true });

  if (fs.existsSync(destPath)) {
    p.image_source_url = localPath;
    skipped++;
    continue;
  }

  process.stdout.write(`Downloading [${p.category}] ${p.slug}... `);
  try {
    await download(srcUrl, destPath);
    p.image_source_url = localPath;
    downloaded++;
    console.log("OK");
  } catch (err) {
    failed++;
    failures.push({ slug: p.slug, url: srcUrl, error: err.message });
    console.log(`FAILED: ${err.message}`);
  }

  // Polite delay to avoid rate-limiting
  await sleep(50);
}

fs.writeFileSync(JSON_PATH, JSON.stringify(products, null, 2) + "\n");

console.log(`\nDone: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed`);
if (failures.length) {
  console.log("\nFailed:");
  failures.forEach((f) => console.log(`  ${f.slug}: ${f.error}`));
}
