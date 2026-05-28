import { SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/store/header";
import { ProductGrid } from "@/components/store/product-grid";
import { getCurrentProfile } from "@/lib/auth";
import { applyCustomerPrices } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; stock?: string }>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("products").select("*").eq("is_hidden", false);
  if (params.category && params.category !== "All Products" && params.category !== "Bulk Orders")
    query = query.eq("category", params.category);
  if (params.category === "Bulk Orders") query = query.eq("is_bulk_available", true);
  if (params.q)
    query = query.or(`name.ilike.%${params.q}%,sku.ilike.%${params.q}%,category.ilike.%${params.q}%`);
  if (params.stock === "instock") query = query.eq("availability_status", "Available");
  if (params.stock === "limited") query = query.in("availability_status", ["Available", "Limited"]);

  if (params.sort === "priceAsc") query = query.order("unit_price", { ascending: true });
  else if (params.sort === "priceDesc") query = query.order("unit_price", { ascending: false });
  else if (params.sort === "newest") query = query.order("created_at", { ascending: false });
  else query = query.order("name");

  const { data } = await query;
  const products = await applyCustomerPrices((data || []) as Product[], profile);

  const isApproved = profile?.is_b2b_approved ?? false;
  const activeFilter = params.category || params.q || params.stock;

  return (
    <>
      <Header profile={profile} />
      <main className="container-shell py-6">
        {/* Pending approval banner */}
        {profile && !isApproved && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            가격은 <strong>승인된 B2B 계정</strong>에만 표시됩니다. 계정 승인 후 확인 가능합니다.
            <span className="ml-2 text-amber-600">· 승인 대기 중</span>
          </div>
        )}
        {!profile && (
          <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            가격 확인을 위해{" "}
            <a href="/register" className="text-(--primary) underline">계정을 신청</a>하거나{" "}
            <a href="/login" className="text-(--primary) underline">로그인</a>하세요.
            승인 후 도매가 전체 공개됩니다.
          </div>
        )}

        {/* Page header */}
        <div className="mb-6 border-b border-slate-200 pb-5">
          <p className="mb-1 text-xs font-black uppercase tracking-widest text-(--primary)">
            {params.category || "All categories"}
          </p>
          <h1 className="text-3xl font-black text-slate-900">
            {params.category ? params.category : "Shop Products"}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            {products.length} product{products.length !== 1 ? "s" : ""}
            {isApproved ? " · B2B pricing shown" : " · Prices visible after approval"}
          </p>
        </div>

        {/* Filters */}
        <form className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
            <SlidersHorizontal size={14} className="text-slate-500" />
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Filters</span>
            {activeFilter && (
              <a href="/products" className="ml-auto text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors">
                Clear filters
              </a>
            )}
          </div>
          <div className="grid gap-3 p-4 lg:grid-cols-[1fr_160px_180px_160px_auto] lg:items-end">
            <label className="label">
              Search
              <input className="field" defaultValue={params.q || ""} name="q" placeholder="Name, SKU, or category" />
            </label>
            <label className="label">
              Category
              <select className="field" defaultValue={params.category || ""} name="category">
                <option value="">All Products</option>
                <option>Car Flags</option>
                <option>Caps</option>
                <option>Bucket Hats</option>
                <option>Boxing Gloves</option>
                <option>Accessories</option>
                <option>Bulk Orders</option>
              </select>
            </label>
            <label className="label">
              Sort by
              <select className="field" defaultValue={params.sort || ""} name="sort">
                <option value="">Name A–Z</option>
                <option value="priceAsc">Price: Low → High</option>
                <option value="priceDesc">Price: High → Low</option>
                <option value="newest">Newest</option>
              </select>
            </label>
            <label className="label">
              Stock
              <select className="field" defaultValue={params.stock || ""} name="stock">
                <option value="">All</option>
                <option value="instock">In Stock</option>
                <option value="limited">In Stock + Limited</option>
              </select>
            </label>
            <button className="btn-primary" type="submit">Apply</button>
          </div>
        </form>

        <ProductGrid products={products} profile={profile} />
      </main>
    </>
  );
}
