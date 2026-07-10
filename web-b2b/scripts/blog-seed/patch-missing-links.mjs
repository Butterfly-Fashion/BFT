// Adds one natural internal link to the 8 seeded posts whose FAQ answers
// ended up without any. Appends a sentence inside the final FAQ answer.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const additions = {
  "price-tag-psychology-small-retail": `Impulse goods from the <a href="/products">wholesale catalog</a> do their best work behind big, visible tags.`,
  "net-30-terms-small-retailers": `Start building that history by <a href="/register">creating a free B2B account</a>.`,
  "reading-wholesale-invoice-checklist": `Our invoices list Item Codes and case pricing plainly — see how ordering works in the <a href="/faq">FAQ</a>.`,
  "fan-gear-assortment-without-jerseys": `Browse <a href="/products">flags, caps, and scarves</a> at wholesale.`,
  "displaying-phone-accessories-small-footprint": `Fast reorders from <a href="/products">local Toronto stock</a> keep every hook full on little tied-up cash.`,
  "handling-defective-electronics-returns": `A local supplier makes that conversation possible — see <a href="/about">how we work</a>.`,
  "social-media-demand-in-store-shelf": `Same-week availability from the <a href="/products">Toronto catalog</a> is what makes catching the window realistic.`,
  "toronto-event-calendar-retail-planning": `Same-day warehouse pickup (see the <a href="/faq">FAQ</a>) covers mid-event top-ups.`,
};

for (const [slug, sentence] of Object.entries(additions)) {
  const { data: post, error } = await db.from("blog_posts").select("id, body_html").eq("slug", slug).single();
  if (error) throw error;
  if (post.body_html.includes('href="/')) { console.log(`Skip (already linked): ${slug}`); continue; }
  if (!post.body_html.endsWith("</p>")) throw new Error(`Unexpected body end for ${slug}`);
  const body = post.body_html.slice(0, -4) + " " + sentence + "</p>";
  const { error: upErr } = await db
    .from("blog_posts")
    .update({ body_html: body, updated_at: new Date().toISOString() })
    .eq("id", post.id);
  if (upErr) throw new Error(`Patch failed for ${slug}: ${upErr.message}`);
  console.log(`Linked: ${slug}`);
}
console.log("Done.");
