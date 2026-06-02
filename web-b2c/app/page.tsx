import { Suspense } from "react";
import dynamic from "next/dynamic";
const HeroCarousel = dynamic(
  () => import("@/components/store/hero-carousel").then((m) => ({ default: m.HeroCarousel })),
  {
    loading: () => (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="w-full rounded-2xl bg-gray-200 animate-pulse" style={{ aspectRatio: "1717/916" }} />
      </div>
    ),
  }
);
import { TrustStrip } from "@/components/store/trust-strip";
import { CategoryStrip } from "@/components/store/category-strip";
import { ProductCard } from "@/components/store/product-card";
import { SocialProof } from "@/components/store/social-proof";
import { NewsletterForm } from "@/components/store/newsletter-form";
import { MobileUrgencyBanner } from "@/components/store/mobile-urgency-banner";
import { HomeSearchBar } from "@/components/store/home-search-bar";
import { getFeaturedProducts, getTrendingProducts } from "@/lib/products";
import { collectionPages, teamPages } from "@/lib/seo-pages";
import { AEO_STORE_DESCRIPTION } from "@/lib/seo";
import Link from "next/link";

const popularSearches = [
  { href: "/collections/best-fifa-2026-merch-canada", label: "Best FIFA 2026 merch in Canada" },
  { href: "/collections/world-cup-bucket-hats-toronto", label: "World Cup bucket hats Toronto" },
  { href: "/collections/canada-soccer-fan-gear", label: "Canada soccer fan gear" },
  { href: "/collections/world-cup-party-supplies-canada", label: "World Cup party supplies Canada" },
  { href: "/collections/world-cup-fan-gear-toronto", label: "World Cup fan gear Toronto" },
];

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ProductGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-200" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Async product sections ───────────────────────────────────────────────────

async function TrendingSection() {
  const trending = await getTrendingProducts();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {trending.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

async function FeaturedSection() {
  const featured = await getFeaturedProducts();
  return (
    <>
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
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      {/* Hero: desktop only */}
      <div className="hidden sm:block">
        <HeroCarousel />
      </div>

      {/* Mobile: urgency banner replaces hero */}
      <MobileUrgencyBanner />

      {/* Search bar — visible on all screen sizes */}
      <HomeSearchBar />

      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="max-w-3xl text-sm font-semibold leading-7 text-gray-700">
            {AEO_STORE_DESCRIPTION}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-500">
            Shop Toronto World Cup merchandise for Canada, USA, Mexico, and international football supporters, including soccer flags, car flags, caps, bucket hats, scarves, sticker packs, and collectible figures.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="flex items-end justify-between mb-6 sm:mb-8">
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

        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <TrendingSection />
        </Suspense>
      </section>

      <TrustStrip />

      {/* Panini Sticker Spotlight */}
      <section className="bg-linear-to-br from-[#0d3b6e] to-[#1565c0] py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-1">
                Official Panini · In Stock Now
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                North America's World Cup.<br className="hidden sm:block" /> Start Collecting.
              </h2>
              <p className="text-blue-200 text-sm mt-1">2026 is history in the making. The album is $8.99 — every pack you open is a memory.</p>
            </div>
            <Link
              href="/collections/panini-stickers"
              className="text-sm font-semibold text-blue-200 hover:text-white transition-colors shrink-0"
            >
              View all stickers →
            </Link>
          </div>
          <div className="flex sm:grid sm:grid-cols-3 gap-4 overflow-x-auto pb-2 sm:overflow-visible sm:pb-0">
            {/* Album — entry product */}
            <Link href="/products/panini-fifa-world-cup-2026-official-sticker-album" className="group shrink-0 w-64 sm:w-auto bg-white/10 hover:bg-white/20 transition-colors rounded-2xl p-5 flex flex-col gap-3 border border-white/20">
              <div className="text-xs font-bold uppercase tracking-widest text-blue-300">Step 1 · Start here</div>
              <div className="font-bold text-white text-lg leading-snug">Official Sticker Album</div>
              <div className="text-3xl font-black text-white">$8.99</div>
              <div className="text-xs text-blue-200">All 48 nations · 670 sticker slots</div>
              <div className="mt-auto pt-3 text-sm font-semibold text-white group-hover:underline">Get the album →</div>
            </Link>
            {/* Box */}
            <Link href="/products/panini-fifa-world-cup-2026-sticker-box-50-packs" className="group shrink-0 w-64 sm:w-auto bg-white/10 hover:bg-white/20 transition-colors rounded-2xl p-5 flex flex-col gap-3 border border-white/20">
              <div className="text-xs font-bold uppercase tracking-widest text-blue-300">Step 2 · Fill it up</div>
              <div className="font-bold text-white text-lg leading-snug">50-Pack Sticker Box</div>
              <div className="text-3xl font-black text-white">$125</div>
              <div className="text-xs text-blue-200">250+ stickers · All 48 teams</div>
              <div className="mt-auto pt-3 text-sm font-semibold text-white group-hover:underline">Shop the box →</div>
            </Link>
            {/* Bundle */}
            <Link href="/products/panini-fifa-world-cup-2026-bundle-album-sticker-box" className="group shrink-0 w-64 sm:w-auto bg-yellow-400/20 hover:bg-yellow-400/30 transition-colors rounded-2xl p-5 flex flex-col gap-3 border-2 border-yellow-400/60">
              <div className="text-xs font-bold uppercase tracking-widest text-yellow-300">Best value · Bundle</div>
              <div className="font-bold text-white text-lg leading-snug">Album + 50-Pack Box</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black text-white">$129.99</div>
                <div className="text-sm text-blue-300 line-through">$133.99</div>
              </div>
              <div className="text-xs text-blue-200">One order · One shipment · Pay shipping once</div>
              <div className="mt-auto pt-3 text-sm font-semibold text-yellow-300 group-hover:underline">Get the bundle →</div>
            </Link>
          </div>
        </div>
      </section>

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

        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <FeaturedSection />
        </Suspense>
      </section>

      <SocialProof />

      <section className="hidden sm:block max-w-6xl mx-auto px-4 sm:px-6 py-14 border-t border-gray-100">
        <div className="grid gap-8 md:grid-cols-[280px_1fr] md:items-start">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
              Popular Searches
            </p>
            <h2 className="text-2xl font-bold text-gray-900">Find match-day gear faster</h2>
            <p className="mt-3 text-sm leading-7 text-gray-500">
              Direct links for the Canada 2026 searches fans use most around Toronto, watch parties, and summer fan zones.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {popularSearches.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-gray-100 bg-white px-5 py-4 text-sm font-bold text-gray-800 shadow-sm hover:border-gray-300 hover:text-[#C41E3A]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Inline newsletter */}
      <section className="bg-[#C41E3A] py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-2">
            Exclusive Fan Deals
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            Get Game Day Deals First
          </h2>
          <p className="text-white/80 text-sm mb-6 max-w-sm mx-auto">
            Join Canadian fans getting exclusive 2026 gear alerts.
          </p>
          <div className="flex justify-center">
            <NewsletterForm source="inline" variant="dark" />
          </div>
        </div>
      </section>

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
    </>
  );
}
