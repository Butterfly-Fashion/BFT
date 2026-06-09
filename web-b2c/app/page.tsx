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
import { ProductCard } from "@/components/store/product-card";
import { SocialProof } from "@/components/store/social-proof";
import { NewsletterForm } from "@/components/store/newsletter-form";
import { MobileUrgencyBanner } from "@/components/store/mobile-urgency-banner";
import { getFeaturedProducts } from "@/lib/products";
import Link from "next/link";

const QUICK_CATEGORIES = [
  { label: "Caps", href: "/collections/world-cup-caps" },
  { label: "Bucket Hats", href: "/collections/world-cup-bucket-hats" },
  { label: "Car Flags", href: "/collections/world-cup-car-flags" },
  { label: "Boxing Gloves", href: "/collections/souvenir-boxing-gloves" },
  { label: "Sticker Packs", href: "/collections/panini-stickers" },
  { label: "Shop All", href: "/products" },
];

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
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

async function ProductGrid() {
  const products = await getFeaturedProducts();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={i < 4} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <div className="hidden sm:block">
        <HeroCarousel />
      </div>
      <MobileUrgencyBanner />

      {/* Category quick-nav — desktop */}
      <div className="hidden sm:block border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 py-2.5 overflow-x-auto">
            {QUICK_CATEGORIES.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors whitespace-nowrap"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Products */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Shop 2026 Fan Gear</h2>
          <Link
            href="/products"
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            View all →
          </Link>
        </div>
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid />
        </Suspense>
        <div className="mt-8 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-3 text-sm font-bold text-white hover:bg-brand-hover transition-colors"
          >
            Browse all products →
          </Link>
        </div>
      </section>

      {/* Trust signals */}
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
                North America&apos;s World Cup.<br className="hidden sm:block" /> Start Collecting.
              </h2>
              <p className="text-blue-200 text-sm mt-1">
                2026 is history in the making. The album is $8.99 — every pack you open is a memory.
              </p>
            </div>
            <Link
              href="/collections/panini-stickers"
              className="text-sm font-semibold text-blue-200 hover:text-white transition-colors shrink-0"
            >
              View all stickers →
            </Link>
          </div>
          <div className="flex sm:grid sm:grid-cols-3 gap-4 overflow-x-auto pb-2 sm:overflow-visible sm:pb-0">
            <Link
              href="/products/panini-fifa-world-cup-2026-official-sticker-album"
              className="group shrink-0 w-64 sm:w-auto bg-white/10 hover:bg-white/20 transition-colors rounded-2xl p-5 flex flex-col gap-3 border border-white/20"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-blue-300">Step 1 · Start here</div>
              <div className="font-bold text-white text-lg leading-snug">Official Sticker Album</div>
              <div className="text-3xl font-black text-white">$8.99</div>
              <div className="text-xs text-blue-200">All 48 nations · 670 sticker slots</div>
              <div className="mt-auto pt-3 text-sm font-semibold text-white group-hover:underline">Get the album →</div>
            </Link>
            <Link
              href="/products/panini-fifa-world-cup-2026-sticker-box-50-packs"
              className="group shrink-0 w-64 sm:w-auto bg-white/10 hover:bg-white/20 transition-colors rounded-2xl p-5 flex flex-col gap-3 border border-white/20"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-blue-300">Step 2 · Fill it up</div>
              <div className="font-bold text-white text-lg leading-snug">50-Pack Sticker Box</div>
              <div className="text-3xl font-black text-white">$125</div>
              <div className="text-xs text-blue-200">350 stickers · All 48 teams</div>
              <div className="mt-auto pt-3 text-sm font-semibold text-white group-hover:underline">Shop the box →</div>
            </Link>
            <Link
              href="/products/panini-fifa-world-cup-2026-bundle-album-sticker-box"
              className="group shrink-0 w-64 sm:w-auto bg-yellow-400/20 hover:bg-yellow-400/30 transition-colors rounded-2xl p-5 flex flex-col gap-3 border-2 border-yellow-400/60"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-yellow-300">Best value · Bundle</div>
              <div className="font-bold text-white text-lg leading-snug">Album + 50-Pack Box</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black text-white">$129.99</div>
                <div className="text-sm text-blue-300 line-through">$133.99</div>
              </div>
              <div className="text-xs text-blue-200">Pickup today · Shipping available</div>
              <div className="mt-auto pt-3 text-sm font-semibold text-yellow-300 group-hover:underline">Get the bundle →</div>
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <SocialProof />

      {/* Newsletter */}
      <section className="border-t border-gray-100 bg-gray-50 py-12">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Get exclusive fan deals</h2>
          <p className="text-sm text-gray-500 mb-5">
            Join Canadian fans getting 2026 gear alerts — no spam.
          </p>
          <div className="flex justify-center">
            <NewsletterForm source="inline" variant="light" />
          </div>
        </div>
      </section>
    </>
  );
}
