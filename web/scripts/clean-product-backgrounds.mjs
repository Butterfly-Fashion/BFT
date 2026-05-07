import sharp from "sharp";
import { copyFile, mkdir, readdir, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const ROOT = resolve("public/asset/images");
const TARGET_DIRS = ["car-flags"];
const BACKUP_ROOT = resolve("public/asset/images-original");

function colorDistance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function sampleBackground(data, width, height) {
  const points = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [Math.floor(width / 2), height - 1],
    [0, Math.floor(height / 2)],
    [width - 1, Math.floor(height / 2)],
  ];

  const colors = points.map(([x, y]) => {
    const offset = (y * width + x) * 4;
    return [data[offset], data[offset + 1], data[offset + 2]];
  });

  return colors
    .reduce((best, color) => {
      const similarCount = colors.filter((candidate) => colorDistance(candidate, color) < 36).length;
      return similarCount > best.count ? { color, count: similarCount } : best;
    }, { color: colors[0], count: 0 })
    .color;
}

function isLikelyBackground(data, index, bg) {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  const distance = colorDistance([r, g, b], bg);
  return distance < 42;
}

function shouldCleanBackground(bg) {
  const [r, g, b] = bg;
  const looksLikeStudioYellow = r > 175 && g > 170 && b > 110 && r - b > 18 && g - b > 18 && Math.abs(r - g) < 45;
  return looksLikeStudioYellow;
}

function buildBackgroundMask(data, width, height) {
  const bg = sampleBackground(data, width, height);
  if (!shouldCleanBackground(bg)) return null;
  const total = width * height;
  const visited = new Uint8Array(total);
  const mask = new Uint8Array(total);
  const queue = [];

  function enqueue(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const pixel = y * width + x;
    if (visited[pixel]) return;
    visited[pixel] = 1;
    const index = pixel * 4;
    if (isLikelyBackground(data, index, bg)) {
      mask[pixel] = 1;
      queue.push(pixel);
    }
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let head = 0; head < queue.length; head += 1) {
    const pixel = queue[head];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  return { mask, bg };
}

function isPaleStudioBackground(data, index, bg) {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max - min;
  const isPaleYellow = r > 165 && g > 160 && b > 105 && r - b > 12 && g - b > 10 && Math.abs(r - g) < 55;
  return isPaleYellow && saturation < 95 && colorDistance([r, g, b], bg) < 78;
}

async function cleanImage(filePath) {
  const backupPath = resolve(BACKUP_ROOT, filePath.slice(ROOT.length + 1));
  await mkdir(dirname(backupPath), { recursive: true });
  if (!existsSync(backupPath)) await copyFile(filePath, backupPath);

  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const background = buildBackgroundMask(data, info.width, info.height);
  if (!background) return false;
  const { mask, bg } = background;
  const output = Buffer.from(data);

  for (let pixel = 0; pixel < mask.length; pixel += 1) {
    const index = pixel * 4;
    if (!mask[pixel] && !isPaleStudioBackground(data, index, bg)) continue;
    output[index] = 255;
    output[index + 1] = 255;
    output[index + 2] = 255;
    output[index + 3] = 255;
  }

  const tempPath = `${filePath}.tmp-clean.jpg`;
  await sharp(output, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(tempPath);
  await rename(tempPath, filePath);
  return true;
}

async function main() {
  let count = 0;
  for (const dirName of TARGET_DIRS) {
    const dir = join(ROOT, dirName);
    const files = (await readdir(dir)).filter((file) => file.toLowerCase().endsWith(".jpg"));
    for (const file of files) {
      if (await cleanImage(join(dir, file))) count += 1;
    }
  }
  console.log(`Cleaned ${count} product images. Originals backed up in ${basename(BACKUP_ROOT)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
