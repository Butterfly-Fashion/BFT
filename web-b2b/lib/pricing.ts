import type { PricedProduct, Product, Profile } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function applyCustomerPrices(products: Product[], profile: Profile | null): Promise<PricedProduct[]> {
  if (!profile || !profile.is_b2b_approved || !products.length) {
    return products.map((product) => ({ ...product, display_price: Number(product.base_price), has_customer_price: false }));
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("customer_prices")
    .select("product_id, price")
    .eq("customer_id", profile.id)
    .in(
      "product_id",
      products.map((product) => product.id)
    );

  const priceMap = new Map((data || []).map((row) => [row.product_id, Number(row.price)]));
  return products.map((product) => {
    const price = priceMap.get(product.id);
    return {
      ...product,
      display_price: price ?? Number(product.base_price),
      has_customer_price: typeof price === "number",
    };
  });
}
