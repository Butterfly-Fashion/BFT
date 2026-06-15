import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbOrderItem, DbProductImage } from "./types";

/**
 * Fill in `image_url` for order items that don't have one stored, by matching
 * each item back to its catalog product (so admins can see the exact design the
 * customer ordered). Matches on slug first, then falls back to product name.
 * Mutates nothing — returns a new array.
 */
export async function enrichOrderItemsWithImages(
  supabase: SupabaseClient,
  items: DbOrderItem[] | null | undefined
): Promise<DbOrderItem[]> {
  if (!items || items.length === 0) return items ?? [];

  const missing = items.filter((i) => !i.image_url);
  if (missing.length === 0) return items;

  const slugs = [...new Set(missing.map((i) => i.slug).filter(Boolean))] as string[];
  const names = [...new Set(missing.map((i) => i.name).filter(Boolean))];

  const orFilters: string[] = [];
  if (slugs.length) orFilters.push(`slug.in.(${slugs.join(",")})`);
  if (names.length) orFilters.push(`name.in.(${names.map((n) => `"${n.replace(/"/g, '""')}"`).join(",")})`);
  if (orFilters.length === 0) return items;

  const { data } = await supabase
    .from("b2c_products")
    .select("slug,name,images")
    .or(orFilters.join(","));

  if (!data?.length) return items;

  const bySlug = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const p of data as { slug: string; name: string; images: DbProductImage[] | null }[]) {
    const url = Array.isArray(p.images) ? p.images[0]?.url : undefined;
    if (!url) continue;
    if (p.slug) bySlug.set(p.slug, url);
    if (p.name) byName.set(p.name, url);
  }

  return items.map((item) =>
    item.image_url
      ? item
      : { ...item, image_url: (item.slug && bySlug.get(item.slug)) || byName.get(item.name) || null }
  );
}
