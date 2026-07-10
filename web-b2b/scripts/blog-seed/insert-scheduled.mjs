// Inserts the 80 seed posts with a 2-per-day publish schedule.
// - Validates slug uniqueness (within batches and against the DB).
// - Interleaves categories round-robin so consecutive days vary in topic.
// - published_at: 2/day at 14:00 and 20:00 UTC (≈10:00 / 16:00 ET) starting START_DATE.
//   Future-dated posts stay hidden until their time via the .lte(published_at, now) filters.
// Idempotent: slugs already in the DB are skipped.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const batches = await Promise.all([
  import("./batch-1-toys.mjs"),
  import("./batch-2-winter.mjs"),
  import("./batch-3-fangear.mjs"),
  import("./batch-4-phone.mjs"),
  import("./batch-5-playbooks.mjs"),
  import("./batch-6-wholesale101.mjs"),
  import("./batch-7-local.mjs"),
  import("./batch-8-merchandising.mjs"),
]);
const all = batches.flatMap((b) => b.posts);

// 1) Uniqueness within the seed set
const seen = new Set();
for (const p of all) {
  if (seen.has(p.slug)) throw new Error(`Duplicate slug in seed data: ${p.slug}`);
  seen.add(p.slug);
  if (!p.title || !p.body_html || !p.excerpt || !p.meta_description || !p.category) {
    throw new Error(`Missing field on: ${p.slug}`);
  }
}
console.log(`Seed posts: ${all.length}, all slugs unique.`);

const env = Object.fromEntries(
  readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 2) Skip slugs already in the DB
const { data: existing, error: exErr } = await db.from("blog_posts").select("slug");
if (exErr) throw exErr;
const existingSlugs = new Set((existing || []).map((r) => r.slug));
const fresh = all.filter((p) => !existingSlugs.has(p.slug));
console.log(`Already in DB: ${all.length - fresh.length}, to insert: ${fresh.length}`);

// 3) Round-robin across categories so the daily pair varies in topic
const byCat = new Map();
for (const p of fresh) {
  if (!byCat.has(p.category)) byCat.set(p.category, []);
  byCat.get(p.category).push(p);
}
const lists = [...byCat.values()];
const ordered = [];
let i = 0;
while (ordered.length < fresh.length) {
  const list = lists[i % lists.length];
  if (list.length) ordered.push(list.shift());
  i += 1;
}

// 4) Schedule: 2/day at 14:00 & 20:00 UTC starting 2026-07-11
const START_DATE = "2026-07-11";
const SLOTS_UTC = ["14:00:00", "20:00:00"];
const rows = ordered.map((p, idx) => {
  const day = Math.floor(idx / 2);
  const d = new Date(`${START_DATE}T${SLOTS_UTC[idx % 2]}Z`);
  d.setUTCDate(d.getUTCDate() + day);
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    body_html: p.body_html,
    category: p.category,
    meta_description: p.meta_description,
    cover_image_url: null,
    status: "published",
    published_at: d.toISOString(),
  };
});

console.log("First 4 scheduled:", rows.slice(0, 4).map((r) => `${r.published_at}  ${r.slug}`));
console.log("Last scheduled:   ", rows.at(-1)?.published_at, rows.at(-1)?.slug);

// 5) Insert in chunks
for (let start = 0; start < rows.length; start += 20) {
  const chunk = rows.slice(start, start + 20);
  const { error } = await db.from("blog_posts").insert(chunk);
  if (error) throw new Error(`Insert failed at chunk ${start}: ${error.message}`);
  console.log(`Inserted ${start + chunk.length}/${rows.length}`);
}
console.log("Done.");
