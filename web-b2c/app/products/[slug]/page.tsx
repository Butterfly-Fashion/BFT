import { getProductBySlug, products } from "@/lib/products";
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
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
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
  const product = getProductBySlug(slug);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Image */}
        <div className="order-1">
          <ProductGallery
            src={product.imageUrl}
            alt={product.name}
            placeholderGradient={product.placeholderGradient}
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

      {/* Related products from same category */}
      <RelatedProducts currentSlug={product.slug} category={product.category} />
    </div>
  );
}

function RelatedProducts({
  currentSlug,
  category,
}: {
  currentSlug: string;
  category: string;
}) {
  const related = products
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
