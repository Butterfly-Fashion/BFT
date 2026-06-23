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
import { WholesaleCta } from "@/components/store/wholesale-cta";
import { MobileUrgencyBanner } from "@/components/store/mobile-urgency-banner";
import { getFeaturedProducts } from "@/lib/products";
import Link from "next/link";
import Image from "next/image";

const QUICK_CATEGORIES = [
  { label: "Jerseys", href: "/products?category=Jerseys" },
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

      {/* Wholesale value band */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:grid-cols-[44%_1fr]">
          <div className="relative aspect-4/3 lg:aspect-auto lg:min-h-80">
            <Image
              src="/asset/jersey/canada-kit-fans.webp"
              alt="Canada 2026 fan gear — jerseys, caps, and flags for wholesale"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 560px"
              priority
            />
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">
              Wholesale · B2B · Canada-wide
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black leading-tight text-gray-900">
              Canada 2026 fan gear at wholesale prices
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              We supply jerseys, 3D-embroidered caps, car flags, and more to retailers,
              event organizers, and resellers across Canada. No retail checkout here —
              tell us what you need and we&apos;ll send you a great B2B price. The more you
              order, the better the price.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <WholesaleCta />
              <Link href="/products" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
                Browse the range →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Our 2026 Wholesale Range</h2>
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
            Browse the full range →
          </Link>
        </div>
      </section>

      {/* Trust signals */}
      <TrustStrip />

      {/* Reviews */}
      <SocialProof />

      {/* B2B contact */}
      <section className="border-t border-gray-100 bg-gray-50 py-14">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Ready to order wholesale?</h2>
          <p className="text-sm leading-6 text-gray-600 mb-6">
            Send us your product list and quantities. We&apos;ll reply with B2B pricing,
            lead times, and availability — usually within one business day.
          </p>
          <div className="flex justify-center">
            <WholesaleCta />
          </div>
        </div>
      </section>
    </>
  );
}
