import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export type { Category, CategoryTree } from "@/lib/category-utils";
export { buildCategoryTree, resolveFilterCategories, navCategories } from "@/lib/category-utils";

export async function fetchCategories() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("b2b_categories")
    .select("id, name, slug, sort_order, is_active, parent_id")
    .eq("is_active", true)
    .order("sort_order");
  return (data || []) as import("@/lib/category-utils").Category[];
}

export async function fetchAllCategories() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("b2b_categories")
    .select("id, name, slug, sort_order, is_active, parent_id")
    .order("sort_order");
  return (data || []) as import("@/lib/category-utils").Category[];
}
