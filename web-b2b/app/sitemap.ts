import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { fetchCategories } from "@/lib/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WHOLESALE_LANDINGS } from "@/lib/wholesale-landing";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/wholesale-catalog`, changeFrequency: "monthly", priority: 0.8 },
    ...WHOLESALE_LANDINGS.map((l) => ({
      url: `${base}/wholesale/${l.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${base}/preorders`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/lookbook`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];

  try {
    const [supabase, categories] = await Promise.all([createSupabaseServerClient(), fetchCategories()]);

    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("is_hidden", false)
      .contains("sales_channels", ["b2b"]);

    productRoutes = (products || [])
      .filter((p): p is { slug: string; updated_at: string | null } => Boolean(p.slug))
      .map((p) => ({
        url: `${base}/products/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      }));

    categoryRoutes = categories
      .filter((c) => c.slug)
      .map((c) => ({
        url: `${base}/collections/${c.slug}`,
        changeFrequency: "weekly",
        priority: 0.6,
      }));
  } catch {
    // If the catalog is unavailable, still return the static routes.
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
