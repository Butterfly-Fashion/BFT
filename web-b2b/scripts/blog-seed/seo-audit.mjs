// SEO audit for all blog posts: titles, meta descriptions, excerpts, slugs,
// heading structure, word count, and internal links. Report-only.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: posts, error } = await db
  .from("blog_posts")
  .select("slug, title, excerpt, meta_description, category, body_html, published_at, status")
  .order("published_at", { ascending: true });
if (error) throw error;

const issues = [];
const stats = { total: posts.length, withIssues: 0 };

for (const p of posts) {
  const probs = [];
  const text = (p.body_html || "").replace(/<[^>]+>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  const h2s = (p.body_html?.match(/<h2>/g) || []).length;
  const internalLinks = (p.body_html?.match(/href="\/(?!\/)/g) || []).length;
  const anyLinks = (p.body_html?.match(/<a /g) || []).length;

  if (!p.title) probs.push("no title");
  else if (p.title.length > 70) probs.push(`title long (${p.title.length})`);
  if (!p.meta_description) probs.push("NO meta_description");
  else {
    if (p.meta_description.length > 165) probs.push(`meta long (${p.meta_description.length})`);
    if (p.meta_description.length < 70) probs.push(`meta short (${p.meta_description.length})`);
  }
  if (!p.excerpt) probs.push("NO excerpt");
  if (!p.category) probs.push("no category");
  if (p.slug.length > 75) probs.push(`slug long (${p.slug.length})`);
  if (h2s < 2) probs.push(`few h2 (${h2s})`);
  if (words < 300) probs.push(`thin content (${words} words)`);
  if (internalLinks === 0) probs.push(`no internal links (total links: ${anyLinks})`);

  if (probs.length) {
    stats.withIssues += 1;
    issues.push(`${p.slug}\n    -> ${probs.join(" | ")}`);
  }
}

console.log(`Total posts: ${stats.total}, with issues: ${stats.withIssues}\n`);
console.log(issues.join("\n"));

// Extra: distribution summaries
const titleLens = posts.map((p) => p.title?.length || 0);
console.log(`\nTitle length: min ${Math.min(...titleLens)} max ${Math.max(...titleLens)}`);
const metaLens = posts.map((p) => p.meta_description?.length || 0);
console.log(`Meta length:  min ${Math.min(...metaLens)} max ${Math.max(...metaLens)}`);
