import { ProductCard } from "@/components/store/product-card";
import {
  collectionPages,
  faqPageJsonLd,
  getProductsForTeam,
  getTeamFaqs,
  getTeamPage,
  getTeamSeoSections,
  teamPages,
} from "@/lib/seo-pages";
import { absoluteUrl, breadcrumbJsonLd, jsonLd } from "@/lib/seo";
import { getBlogPostsBySlugs } from "@/lib/blog-posts";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return teamPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getTeamPage(slug);
  if (!page) return {};
  const canonical = `/teams/${page.slug}`;

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

export default async function TeamLandingPage({ params }: Props) {
  const { slug } = await params;
  const page = getTeamPage(slug);
  if (!page) notFound();

  const teamProducts = getProductsForTeam(page);
  const sections = getTeamSeoSections(page);
  const faqs = getTeamFaqs(page);
  const guides = getBlogPostsBySlugs([
    "world-cup-watch-parties-toronto",
    "world-cup-2026-fan-zones-canada-outdoor-screenings",
    "backyard-world-cup-2026-watch-party-ideas",
  ]);
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Teams", url: "/products" },
    { name: page.team, url: `/teams/${page.slug}` },
  ]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqPageJsonLd(faqs)) }}
      />

      <nav className="mb-5 text-xs text-gray-400">
        <Link href="/products" className="hover:text-gray-700">
          Products
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-600">{page.team}</span>
      </nav>

      <section className="max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
          Shop by Team
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900">{page.title}</h1>
        <p className="mt-4 text-sm leading-7 text-gray-600">{page.intro}</p>
      </section>

      {teamProducts.length > 0 ? (
        <section className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {teamProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      ) : (
        <section className="mt-10 rounded-xl border border-gray-100 bg-white p-8 text-sm text-gray-500">
          More {page.team} products are coming soon. Browse all fan gear while we update this collection.
        </section>
      )}

      <section className="mt-14 grid gap-6 border-t border-gray-100 pt-10 md:grid-cols-3">
        {sections.map((section) => (
          <div key={section.heading} className="rounded-xl border border-gray-100 bg-white p-5">
            <h2 className="text-base font-black text-gray-900">{section.heading}</h2>
            <p className="mt-3 text-sm leading-7 text-gray-600">{section.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <h2 className="text-xl font-black text-gray-900">Quick answers</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <h3 className="text-sm font-bold text-gray-900">{faq.q}</h3>
                <p className="mt-2 text-sm leading-7 text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
        <aside className="rounded-xl border border-gray-100 bg-white p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">
            Related guides
          </h2>
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

      <section className="mt-14 grid gap-8 border-t border-gray-100 pt-10 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Popular Collections</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {collectionPages.map((collection) => (
              <Link
                key={collection.slug}
                href={`/collections/${collection.slug}`}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-400"
              >
                {collection.h1}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Other Teams</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {teamPages
              .filter((team) => team.slug !== page.slug)
              .map((team) => (
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
      </section>
    </main>
  );
}
