/**
 * 모든 상품 이미지를 로컬에 저장하는 스크립트
 * 실행: node download-images.mjs  (web-b2c 폴더에서 실행)
 * 결과: ./downloaded-images/{slug}/ 폴더에 저장
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "fs";
import { join, extname } from "path";

// ─── 1. .env.local 파싱 ──────────────────────────────────────────────────────
function loadEnv(filePath) {
  if (!existsSync(filePath)) return {};
  const lines = readFileSync(filePath, "utf-8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    env[key] = val;
  }
  return env;
}

const env = loadEnv(".env.local");
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Supabase 환경변수가 없습니다. .env.local 확인해주세요.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ─── 2. 이미지 URL 수집 ──────────────────────────────────────────────────────
async function collectImages() {
  const imageList = []; // { slug, url, index }

  // 2a. Supabase DB에서 상품 조회
  console.log("📦 Supabase DB에서 상품 조회 중...");
  const { data: dbProducts, error } = await supabase
    .from("products")
    .select("slug, category, images")
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("⚠️  DB 조회 실패, 정적 상품만 처리합니다:", error.message);
  } else if (dbProducts?.length) {
    console.log(`✅ DB 상품 ${dbProducts.length}개 발견`);
    for (const product of dbProducts) {
      const images = product.images ?? [];
      images.forEach((img, i) => {
        const url = typeof img === "string" ? img : img?.url;
        if (url && !url.startsWith("/")) {
          imageList.push({ slug: product.slug, category: product.category, url, index: i });
        }
      });
    }
  }

  // 2b. source-products.json (정적 fallback 상품들)
  console.log("📄 source-products.json 파싱 중...");
  const sourceJson = JSON.parse(readFileSync("lib/source-products.json", "utf-8"));
  for (const p of sourceJson) {
    const url = p.image_source_url;
    if (url && !url.startsWith("/")) {
      const alreadyInDb = imageList.some((i) => i.slug === p.slug);
      if (!alreadyInDb) {
        imageList.push({ slug: p.slug, category: p.category, url, index: 0 });
      }
    }
  }

  return imageList;
}

// ─── 3. 이미지 다운로드 ──────────────────────────────────────────────────────
async function downloadImage(url, destPath) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; image-downloader/1.0)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buffer);
}

function getExtension(url) {
  const urlPath = url.split("?")[0];
  const ext = extname(urlPath);
  return ext || ".jpg";
}

// ─── 4. 메인 ────────────────────────────────────────────────────────────────
async function main() {
  const outputDir = "downloaded-images";
  mkdirSync(outputDir, { recursive: true });

  const images = await collectImages();
  console.log(`\n🖼️  총 ${images.length}개 이미지 다운로드 시작...\n`);

  let success = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < images.length; i++) {
    const { slug, category, url, index } = images[i];
    const categoryDir = join(outputDir, category ?? "기타");
    mkdirSync(categoryDir, { recursive: true });

    const ext = getExtension(url);
    const filename = index === 0 ? `${slug}${ext}` : `${slug}-${index}${ext}`;
    const destPath = join(categoryDir, filename);

    if (existsSync(destPath)) {
      console.log(`[${i + 1}/${images.length}] ⏭️  스킵: ${category}/${filename}`);
      success++;
      continue;
    }

    try {
      await downloadImage(url, destPath);
      console.log(`[${i + 1}/${images.length}] ✅ ${category}/${filename}`);
      success++;
    } catch (err) {
      console.log(`[${i + 1}/${images.length}] ❌ ${slug} — ${err.message}`);
      errors.push({ slug, url, error: err.message });
      failed++;
    }

    await new Promise((r) => setTimeout(r, 50));
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ 성공: ${success}개`);
  if (failed > 0) {
    console.log(`❌ 실패: ${failed}개`);
    console.log("\n실패 목록:");
    errors.forEach(({ slug, url, error }) =>
      console.log(`  - ${slug}: ${error}\n    ${url}`)
    );
  }
  console.log(`\n📁 저장 위치: ./${outputDir}/`);
}

main().catch((err) => {
  console.error("❌ 오류:", err);
  process.exit(1);
});
