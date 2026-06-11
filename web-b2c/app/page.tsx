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

      {/* Two-product focus */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid gap-4 lg:grid-cols-2">
          <Link
            href="/products?category=Jerseys"
            className="group grid overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:grid-cols-[42%_1fr]"
          >
            <div className="relative aspect-square sm:aspect-auto sm:min-h-72">
              <Image
                src="/asset/jersey/canada-home-kit-main.webp"
                alt="Canada soccer jersey and shorts set — red home kit"
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 1024px) 100vw, 480px"
              />
            </div>
            <div className="flex flex-col justify-center p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">
                Canada Kits · Home & Away
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-gray-900">
                Canada Jersey + Shorts
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Red home and black away kits, adult S–2XL and kids sizes 12–30. Buy more,
                pay less — any 8 sets for $199.
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">$39.99</span>
                <span className="text-sm text-gray-400">adult · $34.99 kids · 8 sets $199</span>
              </div>
              <p className="mt-4 text-sm font-bold text-brand">Shop jerseys →</p>
            </div>
          </Link>

          <Link
            href="/products/panini-fifa-world-cup-2026-sticker-box-50-packs"
            className="group grid overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:grid-cols-[42%_1fr]"
          >
            <div className="relative aspect-square bg-[#0d1b3e] sm:aspect-auto sm:min-h-72">
              <Image
                src="/asset/stickers/world_cup_sticker_box_50.png"
                alt="Panini FIFA World Cup 2026 sticker box — 50 packs"
                fill
                className="object-contain p-5 transition duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 1024px) 100vw, 480px"
              />
            </div>
            <div className="flex flex-col justify-center p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">
                Official Panini · In Stock
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-gray-900">
                50-Pack Sticker Box
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                350 stickers covering all 48 nations. Albums are sold out — sticker boxes
                and loose packs are still in stock and ship from Toronto.
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">$125</span>
                <span className="text-sm text-gray-400">packs from $3.99</span>
              </div>
              <p className="mt-4 text-sm font-bold text-brand">Shop stickers →</p>
            </div>
          </Link>
        </div>
      </section>

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
