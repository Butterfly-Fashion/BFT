import type { PricedProduct, Profile } from "@/lib/types";
import { WholesaleProductBrowser } from "@/components/store/wholesale-product-browser";

export function ProductGrid({ products, profile }: { products: PricedProduct[]; profile: Profile | null }) {
  return <WholesaleProductBrowser products={products} profile={profile} />;
}
