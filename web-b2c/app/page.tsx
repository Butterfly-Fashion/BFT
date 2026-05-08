import { Hero } from "@/components/store/hero";
import { TrustStrip } from "@/components/store/trust-strip";
import { CategoryStrip } from "@/components/store/category-strip";
import { ProductCard } from "@/components/store/product-card";
import { getFeaturedProducts } from "@/lib/products";
import Link from "next/link";

export default function HomePage() {
  const featured = getFeaturedProducts();

  return (
    <>
      <Hero />

      <TrustStrip />

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A] mb-1">
              Fan Favourites
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Featured Products
            </h2>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors hidden sm:inline-flex items-center gap-1"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/products"
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            View all products →
          </Link>
        </div>
      </section>

      <CategoryStrip />

      {/* Promo Banner */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A] mb-3">
            Limited Time
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Free Shipping on Orders Over $99
          </h2>
          <p className="text-gray-400 mb-8 text-sm max-w-md mx-auto">
            Stock up for the tournament. Gear up the whole family and save on
            shipping automatically at checkout.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-[#C41E3A] text-white font-semibold rounded-full hover:bg-[#A01830] transition-colors duration-150 text-sm"
          >
            Shop Now
          </Link>
        </div>
      </section>
    </>
  );
}
