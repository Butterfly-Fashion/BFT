import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

export async function fetchCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("b2b_categories")
    .select("id, name, slug, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order");
  return (data || []) as Category[];
}

export async function fetchAllCategories(): Promise<Category[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("b2b_categories")
    .select("id, name, slug, sort_order, is_active")
    .order("sort_order");
  return (data || []) as Category[];
}

export function categoryNavItems(categories: Category[]) {
  return [
    ...categories.map((c) => ({
      label: c.name,
      href: `/products?category=${encodeURIComponent(c.name)}`,
    })),
    { label: "All products", href: "/products" },
  ];
}
