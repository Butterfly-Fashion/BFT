// One-off: convert the Canada jersey PNGs to compressed WebP for the storefront.
import sharp from "sharp";
import { readdir, unlink } from "node:fs/promises";
import path from "node:path";

const dir = path.resolve("public/asset/jersey");
const files = (await readdir(dir)).filter((f) => f.endsWith(".png"));

for (const file of files) {
  const src = path.join(dir, file);
  const out = src.replace(/\.png$/, ".webp");
  await sharp(src).webp({ quality: 84 }).toFile(out);
  await unlink(src);
  console.log(`${file} -> ${path.basename(out)}`);
}
