import { HeroCarousel } from "@/components/store/hero-carousel";
import { TrustStrip } from "@/components/store/trust-strip";
import { CategoryStrip } from "@/components/store/category-strip";
import { ProductCard } from "@/components/store/product-card";
import { SocialProof } from "@/components/store/social-proof";
import { getFeaturedProducts, getTrendingProducts } from "@/lib/products";
import { collectionPages, teamPages } from "@/lib/seo-pages";
import Link from "next/link";

const SHOW_FREE_SHIPPING_BANNER = false;

export default async function HomePage() {
  const [featured, trending] = await Promise.all([
    getFeaturedProducts(),
    getTrendingProducts(),
  ]);

  return (
    <>
      <HeroCarousel />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A] mb-1">
              Trending Now
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Trending for Canada 2026
            </h2>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors hidden sm:inline-flex items-center gap-1"
          >
            View all
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {trending.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

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

      <SocialProof />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 border-t border-gray-100">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
              Shop by Team
            </p>
            <h2 className="text-2xl font-bold text-gray-900">Find your colours</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {teamPages.map((team) => (
                <Link
                  key={team.slug}
                  href={`/teams/${team.slug}`}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-400 hover:text-gray-900"
                >
                  {team.team}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
              Shop by Gear
            </p>
            <h2 className="text-2xl font-bold text-gray-900">Match-day essentials</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {collectionPages.map((collection) => (
                <Link
                  key={collection.slug}
                  href={`/collections/${collection.slug}`}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-400 hover:text-gray-900"
                >
                  {collection.h1}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CategoryStrip />

      {/* Promo Banner — toggle SHOW_FREE_SHIPPING_BANNER to enable */}
      {SHOW_FREE_SHIPPING_BANNER && (
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
      )}
    </>
  );
}
