import type { PricedProduct, Product, Profile } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function applyCustomerPrices(products: Product[], profile: Profile | null): Promise<PricedProduct[]> {
  const toBase = (p: Product): PricedProduct => ({
    ...p,
    display_price: Number(p.unit_price),
    display_case_price: p.case_price != null ? Number(p.case_price) : null,
    has_customer_price: false,
  });

  if (!profile || !profile.is_b2b_approved || !products.length) {
    return products.map(toBase);
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("customer_prices")
    .select("product_id, unit_price, case_price")
    .eq("customer_id", profile.id)
    .in("product_id", products.map((p) => p.id));

  const priceMap = new Map(
    (data || []).map((row) => [row.product_id, { unit_price: row.unit_price, case_price: row.case_price }])
  );

  return products.map((p) => {
    const custom = priceMap.get(p.id);
    if (!custom) return toBase(p);
    return {
      ...p,
      display_price: custom.unit_price != null ? Number(custom.unit_price) : Number(p.unit_price),
      display_case_price: custom.case_price != null ? Number(custom.case_price) : (p.case_price != null ? Number(p.case_price) : null),
      has_customer_price: true,
    };
  });
}
