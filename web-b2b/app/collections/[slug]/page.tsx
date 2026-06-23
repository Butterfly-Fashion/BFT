import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { ProductGalleryGrid } from "@/components/store/product-gallery-grid";
import { CollectionSidebar } from "@/components/store/collection-sidebar";
import { BackToTop } from "@/components/store/back-to-top";
import { getCurrentProfile } from "@/lib/auth";
import { applyCustomerPrices } from "@/lib/pricing";
import { fetchCategories, buildCategoryTree, resolveFilterCategories } from "@/lib/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categories = await fetchCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  const title = `Wholesale ${category.name} | Butterfly Fashion Trading`;
  const description = `Buy wholesale ${category.name} in bulk. No minimum order — any quantity. Ships across Canada and USA. B2B pricing for approved accounts.`;
  return {
    title,
    description,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: { title, description, url: `/collections/${slug}` },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [profile, categories, supabase] = await Promise.all([
    getCurrentProfile(),
    fetchCategories(),
    createSupabaseServerClient(),
  ]);

  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const categoryTree = buildCategoryTree(categories);
  const filterNames = resolveFilterCategories(category.name, categoryTree);

  let query = supabase
    .from("products")
    .select("*")
    .eq("is_hidden", false)
    .contains("sales_channels", ["b2b"]);

  if (filterNames.length === 1) query = query.eq("category", filterNames[0]);
  else query = query.in("category", filterNames);
  query = query.order("created_at", { ascending: false });

  const { data } = await query;
  const products = await applyCustomerPrices((data || []) as Product[], profile);

  const isApproved = profile?.is_b2b_approved ?? false;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Wholesale ${category.name}`,
    description: `Buy wholesale ${category.name} in bulk. No minimum order — any quantity. Ships across Canada and USA.`,
    url: `${siteUrl()}/collections/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header profile={profile} />
      <main>
        {/* Hero */}
        <section className="border-b border-gray-200 bg-white">
          <div className="container-shell py-8 sm:py-10">
            <nav className="mb-3 flex items-center gap-1.5 text-xs text-gray-400">
              <Link href="/" className="hover:text-gray-700">Home</Link>
              <span>/</span>
              <Link href="/products" className="hover:text-gray-700">Catalog</Link>
              <span>/</span>
              <span className="font-semibold text-gray-700">{category.name}</span>
            </nav>
            <span className="section-label">Wholesale collection</span>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
              {category.name}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-500">
              Wholesale {category.name.toLowerCase()} in bulk. Approved B2B accounts see wholesale pricing.
              No minimum order — ships across Canada and USA.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/register"
                className="btn-primary min-h-8 gap-1.5 px-4 text-sm"
              >
                Get B2B access <ArrowRight size={13} />
              </Link>
              <Link href="/products" className="btn-secondary min-h-8 px-4 text-sm">
                Full catalog
              </Link>
            </div>
          </div>
        </section>

        {/* Access banners */}
        <div className="container-shell pt-5">
          {profile && !isApproved && (
            <div className="mb-5 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
              <span className="stock-dot" style={{ background: "#D97706" }} />
              <span className="font-semibold text-amber-800">
                Wholesale pricing is visible to approved B2B accounts only.
                <span className="ml-2 font-normal text-amber-600">· Pending approval</span>
              </span>
            </div>
          )}
          {!profile && (
            <div className="mb-5 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
              <span className="stock-dot bg-gray-400" />
              <span className="text-gray-600">
                Wholesale pricing visible after{" "}
                <Link href="/register" className="font-semibold underline" style={{ color: "var(--primary)" }}>registering</Link>
                {" "}or{" "}
                <Link href="/login" className="font-semibold underline" style={{ color: "var(--primary)" }}>signing in</Link>.
              </span>
            </div>
          )}
        </div>

        {/* Sidebar + product grid */}
        <div className="container-shell pb-12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
            <CollectionSidebar categories={categories} activeSlug={slug} />

            <div className="min-w-0 flex-1">
              <div className="mb-4 flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-gray-500">
                  {products.length} product{products.length !== 1 ? "s" : ""}
                </p>
              </div>
              <ProductGalleryGrid products={products} profile={profile} />
              {products.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
                  <p className="font-semibold text-gray-400">No products in this collection yet.</p>
                  <Link href="/products" className="mt-3 inline-flex text-sm font-semibold" style={{ color: "var(--primary)" }}>
                    Browse full catalog →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Other collections */}
        {categories.filter((c) => c.slug !== slug).length > 0 && (
          <section className="border-t border-gray-200 bg-white py-8">
            <div className="container-shell">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Other collections</p>
              <div className="flex flex-wrap gap-2">
                {categories
                  .filter((c) => c.slug !== slug)
                  .map((c) => (
                    <Link
                      key={c.slug}
                      href={`/collections/${c.slug}`}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                    >
                      {c.name}
                    </Link>
                  ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
