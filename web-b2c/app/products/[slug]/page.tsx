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
import { productFaqJsonLd, productSeoFaqs, productSeoSections } from "@/lib/product-seo";
import { getRelatedGuidesForProduct } from "@/lib/blog-posts";
import { ProductReviews } from "@/components/store/product-reviews";
import Link from "next/link";
import Image from "next/image";
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
        dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd(product)) }}
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

          <div className="flex items-baseline gap-3 mb-5">
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

          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            {product.description}
          </p>

          {/* Interactive: size + qty + cart — client component */}
          <ProductActions product={product} />

        </div>
      </div>

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
  const guides = getRelatedGuidesForProduct(product);

  return (
    <section className="mt-16 border-t border-gray-100 pt-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
            Buying Guide
          </p>
          <h2 className="mt-2 text-xl font-black text-gray-900">
            About this product
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3 md:items-stretch">
            {sections.map((section, i) => (
              <div key={section.heading} className="rounded-xl border border-gray-100 bg-gray-50 p-5 flex flex-col gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                  {SECTION_ICONS[i]}
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

        {guides.length > 0 && (
          <aside className="rounded-xl border border-gray-100 bg-white p-5 h-fit">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
              Related Guides
            </h3>
            <div className="space-y-5">
              {guides.map((guide) => (
                <Link key={guide.slug} href={`/blog/${guide.slug}`} className="block group">
                  <p className="text-sm font-semibold leading-snug text-gray-900 group-hover:text-[#C41E3A] transition-colors">
                    {guide.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">{guide.description}</p>
                </Link>
              ))}
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
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A] mb-1">
          Featured in This Box
        </p>
        <h2 className="text-xl font-bold text-gray-900">
          Pull These Stars & Hundreds More
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Each 50-pack box includes stickers from all 48 World Cup nations. These are just some of the stars you could pull.
        </p>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {cards.map((card) => (
          <div key={card.name} className="group flex flex-col items-center gap-1.5">
            <div className="relative w-full aspect-2/3 rounded-xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
              <Image
                src={card.imageUrl}
                alt={card.name}
                fill
                sizes="(max-width: 640px) 25vw, (max-width: 768px) 16vw, 12vw"
                className="object-cover"
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
