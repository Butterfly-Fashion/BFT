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

  return (
    <>
      <Header profile={profile} />
      <main className="container-shell py-8">
        {/* Access banners */}
        {profile && !isApproved && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
            <p className="text-sm font-semibold text-amber-800">
              가격은 <strong>승인된 B2B 계정</strong>에만 표시됩니다. 계정 승인 후 확인 가능합니다.
              <span className="ml-2 font-normal text-amber-600">· 승인 대기 중</span>
            </p>
          </div>
        )}
        {!profile && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="h-2 w-2 shrink-0 rounded-full bg-gray-400" />
            <p className="text-sm font-semibold text-gray-600">
              가격 확인을 위해{" "}
              <a href="/register" className="font-bold underline" style={{ color: "var(--primary)" }}>계정을 신청</a>하거나{" "}
              <a href="/login" className="font-bold underline" style={{ color: "var(--primary)" }}>로그인</a>하세요.
              승인 후 도매가 전체 공개됩니다.
            </p>
          </div>
        )}

        {/* Page header + filters row */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {params.category && (
              <span className="section-label">{params.category}</span>
            )}
            <h1 className="mt-1 text-2xl font-black text-gray-900 sm:text-3xl">
              {params.category || "All Products"}
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {products.length} product{products.length !== 1 ? "s" : ""}
              {isApproved ? " · B2B pricing shown" : ""}
            </p>
          </div>
        </div>

        {/* Filters */}
        <form className="mb-6">
          <div className="flex flex-wrap items-end gap-3">
            <label className="label flex-1 min-w-48">
              Search
              <input className="field" defaultValue={params.q || ""} name="q" placeholder="Name, SKU, or category" />
            </label>
            <label className="label w-44">
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
            <label className="label w-44">
              Sort by
              <select className="field" defaultValue={params.sort || ""} name="sort">
                <option value="">Name A–Z</option>
                <option value="priceAsc">Price: Low → High</option>
                <option value="priceDesc">Price: High → Low</option>
                <option value="newest">Newest</option>
              </select>
            </label>
            <label className="label w-40">
              Stock
              <select className="field" defaultValue={params.stock || ""} name="stock">
                <option value="">All</option>
                <option value="instock">In Stock</option>
                <option value="limited">In Stock + Limited</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button className="btn-primary" type="submit">Apply</button>
              {(params.q || params.category || params.stock || params.sort) && (
                <a href="/products" className="btn-secondary">Clear</a>
              )}
            </div>
          </div>
        </form>

        <ProductGrid products={products} profile={profile} />
      </main>
    </>
  );
}
