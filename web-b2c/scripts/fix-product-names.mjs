// One-off cleanup: fix product name casing/mojibake, the Dominican Republic slug,
// and the stray Uruguay glove price in the b2c_products table.
import { readFileSync, copyFileSync, existsSync } from "node:fs";
import path from "node:path";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

function fixName(name) {
  let n = name;
  // mojibake from a bad CSV import
  n = n.replaceAll("â€™", "'").replaceAll("â€“", "–").replaceAll("â€”", "—").replaceAll("Â", "");
  n = n.replace(/€“/g, "–"); // €“ leftover when Â was stripped first
  // casing fixes
  n = n.replace(/\b3d\b/g, "3D");
  n = n.replace(/U\.s\.a/g, "USA").replace(/\bUsa\b/g, "USA").replace(/\bUk\b/g, "UK");
  n = n.replace(/\(uk\b/g, "(UK").replace(/\(st /g, "(St ");
  n = n.replace(/Costarica/g, "Costa Rica").replace(/Equador/g, "Ecuador");
  n = n.replace(/Figc/g, "FIGC");
  // capitalize first letter inside [...] groups, incl. after "/"
  n = n.replace(/\[([^\]]+)\]/g, (_, inner) =>
    `[${inner.replace(/(^|\/| )([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase())}]`
  );
  return n.replace(/\s{2,}/g, " ").trim();
}

const DRY_RUN = process.argv.includes("--dry-run");

const res = await fetch(
  `${URL_}/rest/v1/b2c_products?select=id,name,slug,price,images&order=name`,
  { headers }
);
const products = await res.json();

let changed = 0;
for (const p of products) {
  const patch = {};
  const fixed = fixName(p.name);
  if (fixed !== p.name) {
    patch.name = fixed;
    if (Array.isArray(p.images)) {
      patch.images = p.images.map((img) => ({ ...img, alt: fixName(img.alt ?? fixed) }));
    }
  }

  if (p.slug === "denmark-flag-3d-embroidered-cap-1") {
    patch.slug = "dominican-republic-3d-embroidered-cap";
    patch.images = [
      { url: "/asset/images/caps/dominican-republic-3d-embroidered-cap.jpg", alt: fixed },
    ];
    const oldImg = path.join("public/asset/images/caps", "denmark-flag-3d-embroidered-cap-1.jpg");
    const newImg = path.join("public/asset/images/caps", "dominican-republic-3d-embroidered-cap.jpg");
    if (existsSync(oldImg) && !existsSync(newImg)) copyFileSync(oldImg, newImg);
  }

  if (p.slug === "uruguay-flag-souvenir-mini-boxing-glove" && Number(p.price) !== 12.99) {
    patch.price = 12.99;
  }

  if (Object.keys(patch).length === 0) continue;
  if (!DRY_RUN) {
    const r = await fetch(`${URL_}/rest/v1/b2c_products?id=eq.${p.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(patch),
    });
    if (!r.ok) {
      console.error(`FAILED ${p.slug}: ${r.status} ${await r.text()}`);
      continue;
    }
  }
  changed++;
  console.log(`${p.name}  ->  ${patch.name ?? p.name}${patch.slug ? `  [slug: ${patch.slug}]` : ""}${patch.price ? `  [price: ${patch.price}]` : ""}`);
}
console.log(`\n${changed} of ${products.length} products ${DRY_RUN ? "would be" : ""} updated`);
