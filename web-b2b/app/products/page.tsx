import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { ProductGalleryGrid } from "@/components/store/product-gallery-grid";
import { CatalogFilterSidebar } from "@/components/store/catalog-filter-sidebar";
import { CatalogTopBar } from "@/components/store/catalog-top-bar";
import { getCurrentProfile } from "@/lib/auth";
import { applyCustomerPrices } from "@/lib/pricing";
import { fetchCategories, buildCategoryTree, resolveFilterCategories } from "@/lib/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wholesale Catalog",
  description:
    "Browse the Butterfly Fashion Trading wholesale catalog — winter accessories, novelty & fidget toys, rolling papers, and trending variety goods with Item Codes, no minimum order, and B2B pricing for approved accounts. Ships from Toronto across Canada & the USA.",
  alternates: { canonical: "/products" },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const [profile, categories, supabase] = await Promise.all([
    getCurrentProfile(),
    fetchCategories(),
    createSupabaseServerClient(),
  ]);

  const categoryTree = buildCategoryTree(categories);
  let query = supabase.from("products").select("*").eq("is_hidden", false).contains("sales_channels", ["b2b"]);
  if (params.category && params.category !== "All Products") {
    const filterNames = resolveFilterCategories(params.category, categoryTree);
    if (filterNames.length === 1) query = query.eq("category", filterNames[0]);
    else query = query.in("category", filterNames);
  }
  if (params.q)
    query = query.or(`name.ilike.%${params.q}%,sku.ilike.%${params.q}%,category.ilike.%${params.q}%,country.ilike.%${params.q}%`);

  if (params.sort === "priceAsc") query = query.order("unit_price", { ascending: true });
  else if (params.sort === "priceDesc") query = query.order("unit_price", { ascending: false });
  else if (params.sort === "newest") query = query.order("created_at", { ascending: false });
  else query = query.order("name", { ascending: true });

  const { data } = await query;
  const products = await applyCustomerPrices((data || []) as Product[], profile);
  const isApproved = profile?.is_b2b_approved ?? false;

  return (
    <>
      <Header profile={profile} />
      <main className="container-shell py-6">
        {/* Access banners */}
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

        {/* Top bar (client: search + sort) */}
        <Suspense fallback={null}>
          <CatalogTopBar
            initialQ={params.q}
            initialSort={params.sort}
            category={params.category}
            productCount={products.length}
            title={params.category || "Wholesale Catalog"}
            isApproved={isApproved}
          />
        </Suspense>

        {/* Sidebar + Table */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
          <Suspense fallback={null}>
            <CatalogFilterSidebar productCount={products.length} categories={categories} />
          </Suspense>

          <div className="min-w-0 flex-1">
            <ProductGalleryGrid products={products} profile={profile} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
