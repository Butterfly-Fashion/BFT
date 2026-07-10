// Applies SEO fixes to blog posts:
// 1. Appends a unique FAQ section (with internal links) to each of the 80 seeded posts.
// 2. Shortens over-long titles (>70 chars) for SERP display.
// 3. Adds the missing excerpt to the panini post; trims one over-long meta description.
// Idempotent: posts already containing the FAQ heading are skipped.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const faqModules = await Promise.all([
  import("./faq-1-toys-winter.mjs"),
  import("./faq-2-fangear-phone.mjs"),
  import("./faq-3-playbooks-wholesale.mjs"),
  import("./faq-4-local-merch.mjs"),
]);
const faqBySlug = Object.assign({}, ...faqModules.map((m) => m.faqs));

// Sanity: every seeded slug must have FAQs
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
const seededSlugs = batches.flatMap((b) => b.posts.map((p) => p.slug));
const missing = seededSlugs.filter((s) => !faqBySlug[s]);
if (missing.length) throw new Error(`Missing FAQs for: ${missing.join(", ")}`);
console.log(`FAQ coverage OK for all ${seededSlugs.length} seeded posts.`);

const env = Object.fromEntries(
  readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const FAQ_HEADING = "<h2>Frequently asked questions</h2>";

function faqHtml(entries) {
  return (
    FAQ_HEADING +
    entries.map((e) => `<h3>${e.q}</h3><p>${e.a}</p>`).join("")
  );
}

// 1) Append FAQ sections
let appended = 0;
for (const slug of seededSlugs) {
  const { data: post, error } = await db.from("blog_posts").select("id, body_html").eq("slug", slug).single();
  if (error) throw error;
  if (post.body_html.includes(FAQ_HEADING)) continue;
  const { error: upErr } = await db
    .from("blog_posts")
    .update({ body_html: post.body_html + faqHtml(faqBySlug[slug]), updated_at: new Date().toISOString() })
    .eq("id", post.id);
  if (upErr) throw new Error(`FAQ append failed for ${slug}: ${upErr.message}`);
  appended += 1;
}
console.log(`FAQ sections appended: ${appended}`);

// 2) Title shortenings (SERP display) + 3) excerpt / meta fixes
const patches = [
  {
    slug: "handling-demand-spikes-collectibles",
    set: { title: "Handling Demand Spikes on Collectibles: Sticker Season Lessons" },
  },
  {
    slug: "handling-defective-electronics-returns",
    set: { title: "Handling Budget Electronics Returns Without Losing Customers" },
  },
  {
    slug: "supporting-independent-retail-canada",
    set: { title: "The Case for Independent Retail — and Its Supply Chains" },
  },
  {
    slug: "wholesale-impulse-buys-phone-accessories-squishy-toys",
    set: { title: "High-Margin Impulse Buys: Phone Accessories & Squishy Toys" },
  },
  {
    slug: "panini-2026-world-cup-stickers-wholesale",
    set: {
      title: "Panini 2026 World Cup Stickers — Wholesale $89.99/Box (Min. 10)",
      excerpt:
        "Panini 2026 World Cup sticker boxes are available wholesale from our Toronto warehouse — $89.99 per box, 10-box minimum, shipping across Canada and the US.",
    },
  },
  {
    slug: "fidget-toys-dollar-store-buying-guide",
    set: {
      meta_description:
        "Which fidget formats work at dollar-store price points, display tips, and keeping the section fresh — a wholesale buying guide for Canadian value retailers.",
    },
  },
];

for (const patch of patches) {
  const { error: upErr } = await db
    .from("blog_posts")
    .update({ ...patch.set, updated_at: new Date().toISOString() })
    .eq("slug", patch.slug);
  if (upErr) throw new Error(`Patch failed for ${patch.slug}: ${upErr.message}`);
  console.log(`Patched: ${patch.slug} (${Object.keys(patch.set).join(", ")})`);
}
console.log("Done.");
