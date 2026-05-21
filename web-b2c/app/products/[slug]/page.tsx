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

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlugFromDb(slug);
  if (!product) notFound();
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

      {/* Related products from same category */}
      <RelatedProducts currentSlug={product.slug} category={product.category} />
    </div>
  );
}

function ProductSeoContent({ product }: { product: Product }) {
  const sections = productSeoSections(product);
  const faqs = productSeoFaqs(product);
  const guides = getRelatedGuidesForProduct(product);

  return (
    <section className="mt-16 grid gap-8 border-t border-gray-100 pt-10 lg:grid-cols-[1fr_320px]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
          Buying Guide
        </p>
        <h2 className="mt-2 text-2xl font-black text-gray-900">
          More about {product.name}
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {sections.map((section) => (
            <section key={section.heading} className="rounded-xl border border-gray-100 bg-white p-5">
              <h3 className="text-sm font-bold text-gray-900">{section.heading}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6">
          <h3 className="text-lg font-black text-gray-900">Product questions</h3>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <h4 className="text-sm font-bold text-gray-900">{faq.q}</h4>
                <p className="mt-2 text-sm leading-7 text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="rounded-xl border border-gray-100 bg-white p-5">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">
          Related guides
        </h3>
        <div className="mt-4 space-y-4">
          {guides.map((guide) => (
            <Link key={guide.slug} href={`/blog/${guide.slug}`} className="block group">
              <p className="text-sm font-bold leading-snug text-gray-900 group-hover:text-[#C41E3A]">
                {guide.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-500">{guide.description}</p>
            </Link>
          ))}
        </div>
      </aside>
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
