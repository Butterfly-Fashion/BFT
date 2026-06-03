/**
 * One-time script: update sticker product images in Supabase DB.
 * Only updates the `images` field — does not touch prices or other fields.
 */

const SUPABASE_URL = "https://zgztvepfolbztbweoxcl.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnenR2ZXBmb2xienRid2VveGNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA1OTgwNywiZXhwIjoyMDkzNjM1ODA3fQ.GbgWafFNj45TKFABXmmviCgyWUQHHsVSGcxtcr3EhRk";

const FIXES = [
  { slug: "panini-fifa-world-cup-2026-official-sticker-album-hard-cover", url: "/asset/stickers/hardcoveralbum.jpg", alt: "Panini FIFA World Cup 2026 Official Sticker Album – Hard Cover" },
  { slug: "panini-fifa-world-cup-2026-sticker-pack-single",               url: "/asset/stickers/sticker1.png",       alt: "Panini FIFA World Cup 2026 Sticker Pack – 1 Pack" },
  { slug: "panini-fifa-world-cup-2026-starter-kit-album-10-packs",        url: "/asset/stickers/starterkit.jpg",     alt: "Panini FIFA World Cup 2026 Starter Kit – Album + 10 Packs" },
  { slug: "panini-fifa-world-cup-2026-bundle-hard-cover-sticker-box",     url: "/asset/stickers/hardcoverbundle.png",alt: "Panini FIFA World Cup 2026 Bundle – Hard Cover Album + 50-Pack Box" },
  { slug: "panini-fifa-world-cup-2026-sticker-packs-5",                   url: "/asset/stickers/sticker5.png",       alt: "Panini FIFA World Cup 2026 Sticker Packs – 5 Packs" },
  { slug: "panini-fifa-world-cup-2026-sticker-packs-10",                  url: "/asset/stickers/sticker10.png",      alt: "Panini FIFA World Cup 2026 Sticker Packs – 10 Packs" },
  { slug: "panini-fifa-world-cup-2026-sticker-packs-20",                  url: "/asset/stickers/sticker20.png",      alt: "Panini FIFA World Cup 2026 Sticker Packs – 20 Packs" },
];

async function updateImage(slug, imageUrl, alt) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/b2c_products?slug=eq.${encodeURIComponent(slug)}`,
    {
      method: "PATCH",
      headers: {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({ images: [{ url: imageUrl, alt }] }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    console.error(`❌ ${slug}: ${JSON.stringify(data)}`);
  } else if (!data.length) {
    console.warn(`⚠️  ${slug}: 제품을 찾을 수 없음 (DB에 없음)`);
  } else {
    console.log(`✅ ${slug}`);
  }
}

for (const fix of FIXES) {
  await updateImage(fix.slug, fix.url, fix.alt);
}

console.log("완료");
