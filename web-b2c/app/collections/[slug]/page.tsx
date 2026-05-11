import { ProductCard } from "@/components/store/product-card";
import {
  collectionPages,
  getCollectionPage,
  getProductsForCollection,
  teamPages,
} from "@/lib/seo-pages";
import { absoluteUrl, breadcrumbJsonLd, jsonLd } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return collectionPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getCollectionPage(slug);
  if (!page) return {};
  const canonical = `/collections/${page.slug}`;

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: absoluteUrl(canonical),
      type: "website",
    },
  };
}

export default async function CollectionLandingPage({ params }: Props) {
  const { slug } = await params;
  const page = getCollectionPage(slug);
  if (!page) notFound();

  const collectionProducts = getProductsForCollection(page);
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Collections", url: "/products" },
    { name: page.h1, url: `/collections/${page.slug}` },
  ]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }}
      />

      <nav className="mb-5 text-xs text-gray-400">
        <Link href="/products" className="hover:text-gray-700">
          Products
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-600">{page.h1}</span>
      </nav>

      <section className="max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
          Canada 2026 Fan Gear
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900">{page.h1}</h1>
        <p className="mt-4 text-sm leading-7 text-gray-600">{page.intro}</p>
      </section>

      <section className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {collectionProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>

      <section className="mt-14 grid gap-8 border-t border-gray-100 pt-10 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Shop by Team</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {teamPages.map((team) => (
              <Link
                key={team.slug}
                href={`/teams/${team.slug}`}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-400"
              >
                {team.team}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">More Collections</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {collectionPages
              .filter((item) => item.slug !== page.slug)
              .map((item) => (
                <Link
                  key={item.slug}
                  href={`/collections/${item.slug}`}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-400"
                >
                  {item.h1}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </main>
  );
}
