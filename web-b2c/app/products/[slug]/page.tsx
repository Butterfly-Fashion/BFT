import { getProductBySlugFromDb, getAllSlugs, getAllProducts } from "@/lib/products";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatCAD } from "@/lib/money";
import { ProductActions } from "./product-actions";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductCard } from "@/components/store/product-card";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLd,
  productJsonLd,
  productSeoDescription,
  productSeoTitle,
} from "@/lib/seo";
import { productFaqJsonLd, productSeoFaqs, productSeoLinks, productSeoSections } from "@/lib/product-seo";
import { getRelatedGuidesForProduct } from "@/lib/blog-posts";
import { normalizeStockStatus, stockStatusDisplay } from "@/lib/stock-status";
import dynamic from "next/dynamic";
const ProductReviews = dynamic(
  () => import("@/components/store/product-reviews").then((m) => ({ default: m.ProductReviews }))
);
import Link from "next/link";
import Image from "next/image";
import { ProductImage } from "@/components/store/product-image";
import type { PlayerCard, Product } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlugFromDb(slug);
  if (!product) return {};
  const canonical = `/products/${product.slug}`;
  return {
    title: productSeoTitle(product),
    description: productSeoDescription(product),
    alternates: {
      canonical,
    },
    openGraph: {
      title: productSeoTitle(product),
      description: productSeoDescription(product),
      url: absoluteUrl(canonical),
      type: "website",
      images: [{ url: absoluteUrl(product.imageUrl) }],
    },
    twitter: {
      card: "summary_large_image",
      title: productSeoTitle(product),
      description: productSeoDescription(product),
      images: [absoluteUrl(product.imageUrl)],
    },
  };
}

async function getReviews(slug: string) {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fifa2026.ca";
    const res = await fetch(`${base}/api/reviews?slug=${slug}`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlugFromDb(slug);
  if (!product) notFound();
  const initialReviews = await getReviews(slug);
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Products", url: "/products" },
    { name: product.category, url: `/products?category=${encodeURIComponent(product.category)}` },
    { name: product.name, url: `/products/${product.slug}` },
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd(product, initialReviews)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productFaqJsonLd(product)) }}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Image */}
        <div className="order-1">
          <ProductGallery
            src={product.imageUrl}
            alt={product.name}
            placeholderGradient={product.placeholderGradient}
            additionalImages={product.additionalImages}
          />
        </div>

        {/* Details */}
        <div className="order-2 flex flex-col justify-start">
          {/* Breadcrumb */}
          <nav className="text-xs text-gray-400 mb-5 flex items-center gap-1.5 flex-wrap">
            <Link href="/products" className="hover:text-gray-700 transition-colors">
              Products
            </Link>
            <span>/</span>
            <Link
              href={`/products?category=${encodeURIComponent(product.category)}`}
              className="hover:text-gray-700 transition-colors"
            >
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-gray-600 truncate max-w-45">{product.name}</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-3">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-2xl font-bold text-gray-900">
              {formatCAD(product.price)}
            </span>
            {product.comparePrice && (
              <span className="text-base text-gray-400 line-through">
                {formatCAD(product.comparePrice)}
              </span>
            )}
            <span className="text-xs text-gray-400">CAD</span>
          </div>

          <div className="flex items-center gap-2 mb-5">
            {(() => {
              const stock = product.inStock
                ? stockStatusDisplay(normalizeStockStatus(product.stockStatus))
                : stockStatusDisplay("sold_out");
              return (
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${stock.pillClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${stock.dotClass}`} />
                  {stock.label}
                </span>
              );
            })()}
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            {product.description}
          </p>

          {/* World Cup delivery deadline — dynamic */}
          {product.inStock && (() => {
            const now = new Date();
            const kickoff = new Date("2026-06-12T23:00:00Z");
            const cutoff = new Date("2026-06-09T23:59:59Z");
            if (now > kickoff) return null;
            const isPastCutoff = now > cutoff;
            return (
              <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
                <span className="text-lg leading-none mt-0.5">⚽</span>
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    {isPastCutoff
                      ? "Pickup available today in North York"
                      : "Order by June 9 — arrive before kickoff"}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {isPastCutoff
                      ? "Shipping is also available from Toronto within 1-2 business days"
                      : "World Cup opens June 12 · Ships from Toronto within 1–2 business days"}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Interactive: size + qty + cart — client component */}
          <ProductActions product={product} />

          <div className="mt-5 grid grid-cols-1 gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-600 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Free pickup in North York</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Same-day pickup available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Secure checkout with Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>30-day returns on unused items</span>
            </div>
          </div>

        </div>
      </div>

      {/* Lookbook-style detail image (jersey kits) */}
      {product.detailImage && (
        <section className="mt-14 max-w-3xl mx-auto">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Product details</h2>
          <Image
            src={product.detailImage}
            alt={`${product.name} — detailed views`}
            width={900}
            height={1850}
            className="w-full h-auto rounded-2xl border border-gray-100"
          />
        </section>
      )}

      {/* Parallel rarity table — sticker box & bundle only */}
      {(product.slug === "panini-fifa-world-cup-2026-sticker-box-50-packs" ||
        product.slug === "panini-fifa-world-cup-2026-bundle-album-sticker-box") && (
        <RaritySection />
      )}

      {/* Player cards section — sticker box only */}
      {product.playerCards && product.playerCards.length > 0 && (
        <PlayerCardsSection cards={product.playerCards} />
      )}

      <ProductSeoContent product={product} />

      <ProductReviews productSlug={product.slug} initialReviews={initialReviews} />

      {/* Related products from same category */}
      <RelatedProducts currentSlug={product.slug} category={product.category} />
    </div>
  );
}

const SECTION_ICONS = [
  // Who it's for
  <svg key="who" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  // Match day
  <svg key="match" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  // Gift
  <svg key="gift" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>,
];

function ProductSeoContent({ product }: { product: Product }) {
  const sections = productSeoSections(product);
  const faqs = productSeoFaqs(product);
  const searchLinks = productSeoLinks(product);
  const guides = getRelatedGuidesForProduct(product);

  return (
    <section className="mt-16 border-t border-gray-100 pt-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">
            Buying Guide
          </p>
          <h2 className="mt-2 text-xl font-black text-gray-900">
            About this product
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3 md:items-stretch">
            {sections.map((section, i) => (
              <div key={section.heading} className="rounded-xl border border-gray-100 bg-gray-50 p-5 flex flex-col gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                  {SECTION_ICONS[i % SECTION_ICONS.length]}
                </div>
                <h3 className="text-sm font-bold text-gray-900 leading-snug">{section.heading}</h3>
                <p className="text-xs leading-6 text-gray-500 flex-1">{section.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6">
            <h3 className="text-base font-black text-gray-900">Common questions</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {faqs.map((faq) => (
                <div key={faq.q} className="border-l-2 border-gray-100 pl-4">
                  <h4 className="text-sm font-semibold text-gray-900">{faq.q}</h4>
                  <p className="mt-1.5 text-xs leading-6 text-gray-500">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {(guides.length > 0 || searchLinks.length > 0) && (
          <aside className="rounded-xl border border-gray-100 bg-white p-5 h-fit">
            {guides.length > 0 && (
              <>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                  Related Guides
                </h3>
                <div className="space-y-5">
                  {guides.map((guide) => (
                    <Link key={guide.slug} href={`/blog/${guide.slug}`} className="block group">
                      <p className="text-sm font-semibold leading-snug text-gray-900 group-hover:text-brand transition-colors">
                        {guide.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-400">{guide.description}</p>
                    </Link>
                  ))}
                </div>
              </>
            )}
            <div className={guides.length > 0 ? "mt-6 border-t border-gray-100 pt-5" : ""}>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                Popular Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {searchLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-gray-400 hover:text-gray-900"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}

function PlayerCardsSection({ cards }: { cards: PlayerCard[] }) {
  return (
    <div className="mt-16">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-1">
          Could your box have one of these?
        </p>
        <h2 className="text-xl font-bold text-gray-900">
          Rare Pulls. Iconic Stars. You Won't Know Until You Open It.
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Every box is different. These are some of the stars buried across 50 packs — rare parallels, fan favourites, and players you'll want to keep.
        </p>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {cards.map((card) => (
          <div key={card.name} className="group flex flex-col items-center gap-1.5">
            <div className="relative w-full aspect-2/3 rounded-xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
              <ProductImage
                src={card.imageUrl}
                alt={card.name}
                sizes="(max-width: 640px) 25vw, (max-width: 768px) 16vw, 12vw"
                placeholderGradient="linear-gradient(145deg, #e0e0e0 0%, #c0c0c0 100%)"
              />
            </div>
            <p className="text-[10px] font-semibold text-gray-600 text-center leading-tight line-clamp-2">
              {card.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const PARALLELS = [
  { color: "#2563eb", label: "Blue",   odds: "1 in 2 packs",     note: "Most common — still a great pull" },
  { color: "#dc2626", label: "Red",    odds: "1 in 25 packs",    note: "Rare enough to stand out" },
  { color: "#7c3aed", label: "Purple", odds: "1 in 200 packs",   note: "Very rare" },
  { color: "#16a34a", label: "Green",  odds: "1 in 1,400 packs", note: "Extremely rare" },
  { color: "#111827", label: "Black",  odds: "1 of 1",           note: "One exists in the world" },
];

function RaritySection() {
  return (
    <div className="mt-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-1">
        Parallel Rarity System
      </p>
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        What Could Be in Your Box?
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Every box contains standard stickers — plus a chance at limited parallel versions of the same cards. The rarer the colour, the fewer exist in the world.
      </p>

      <div className="rounded-2xl border border-gray-100 overflow-hidden">
        {/* header */}
        <div className="grid grid-cols-3 bg-gray-50 px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-400">
          <span>Parallel</span>
          <span className="text-center">Pull Rate</span>
          <span className="text-right">Rarity</span>
        </div>

        {PARALLELS.map((p, i) => (
          <div
            key={p.label}
            className={`grid grid-cols-3 items-center px-5 py-4 ${i !== PARALLELS.length - 1 ? "border-b border-gray-100" : ""}`}
          >
            {/* colour swatch + label */}
            <div className="flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                style={{ background: p.color }}
              />
              <span className="text-sm font-bold text-gray-900">{p.label}</span>
            </div>

            {/* odds */}
            <span className="text-sm font-semibold text-gray-700 text-center">{p.odds}</span>

            {/* note */}
            <span className="text-xs text-gray-400 text-right">{p.note}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-gray-400 px-1">
        Pull rates are approximate. Black parallels are numbered 1/1 — only one exists per player.
      </p>
    </div>
  );
}

async function RelatedProducts({
  currentSlug,
  category,
}: {
  currentSlug: string;
  category: string;
}) {
  const all = await getAllProducts();
  const related = all
    .filter((p) => p.category === category && p.slug !== currentSlug)
    .slice(0, 4);

  if (related.length === 0) return null;

  return (
    <div className="mt-16">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        More {category}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
