// One-off: shift the 80 seeded posts' published_at back by 1 day so the
// schedule starts today (2026-07-10) instead of tomorrow. Only touches
// slugs present in the seed batches — the original 6 posts are unaffected.
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
const seedSlugs = batches.flatMap((b) => b.posts.map((p) => p.slug));

const env = Object.fromEntries(
  readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: rows, error } = await db
  .from("blog_posts")
  .select("id, slug, published_at")
  .in("slug", seedSlugs);
if (error) throw error;
console.log(`Found ${rows.length} seeded posts to shift.`);

for (const row of rows) {
  const d = new Date(row.published_at);
  d.setUTCDate(d.getUTCDate() - 1);
  const { error: upErr } = await db
    .from("blog_posts")
    .update({ published_at: d.toISOString() })
    .eq("id", row.id);
  if (upErr) throw new Error(`Update failed for ${row.slug}: ${upErr.message}`);
}

const { data: check } = await db
  .from("blog_posts")
  .select("slug, published_at")
  .in("slug", seedSlugs)
  .order("published_at", { ascending: true });
console.log("First 4:", check.slice(0, 4).map((r) => `${r.published_at}  ${r.slug}`));
console.log("Last:   ", check.at(-1)?.published_at, check.at(-1)?.slug);
