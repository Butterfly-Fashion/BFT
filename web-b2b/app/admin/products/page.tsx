import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { formatMoney } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; visibility?: string }>;
}) {
  const params = await searchParams;
  const admin = createSupabaseAdminClient();

  let query = admin.from("products").select("*").order("updated_at", { ascending: false });
  if (params.category) query = query.eq("category", params.category);
  if (params.visibility === "visible") query = query.eq("is_hidden", false);
  if (params.visibility === "hidden") query = query.eq("is_hidden", true);
  if (params.q)
    query = query.or(`name.ilike.%${params.q}%,sku.ilike.%${params.q}%,category.ilike.%${params.q}%`);

  const [{ data: products }, { data: allProducts }] = await Promise.all([
    query,
    admin.from("products").select("*"),
  ]);

  const productList = products || [];
  const all = allProducts || [];
  const visibleCount = all.filter((p) => !p.is_hidden).length;
  const hiddenCount = all.filter((p) => p.is_hidden).length;
  const categories = [...new Set(all.map((p) => p.category).filter(Boolean))].sort();
  const inventoryValue = all.reduce((sum, p) => sum + Number(p.unit_price || 0), 0);
  const stripeFailedCount = all.filter((p) => p.stripe_sync_status === "failed").length;

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label">Product management</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Products</h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              Manage catalog, pricing, images, and storefront visibility.
            </p>
          </div>
          <div className="flex gap-2">
            <Link className="btn-secondary text-xs" href="/products">View storefront</Link>
            <Link className="btn-primary gap-1.5 text-xs" href="/admin/products/new">
              <Plus size={13} /> Create product
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Total products", value: all.length },
            { label: "Visible", value: visibleCount },
            { label: "Hidden", value: hiddenCount },
            { label: `${categories.length} categories · Base total`, value: formatMoney(inventoryValue) },
            { label: "Stripe sync issues", value: stripeFailedCount },
          ].map(({ label, value }) => (
            <div key={label} className="card p-4">
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <strong className="mt-2 block text-2xl font-black text-slate-900">{value}</strong>
            </div>
          ))}
        </section>

        {/* Filters */}
        <form className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid gap-3 p-4 lg:grid-cols-[1fr_190px_170px_auto] lg:items-end">
            <label className="label">
              Search products
              <input className="field" defaultValue={params.q || ""} name="q" placeholder="Product name, SKU, or category" />
            </label>
            <label className="label">
              Category
              <select className="field" defaultValue={params.category || ""} name="category">
                <option value="">All categories</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="label">
              Visibility
              <select className="field" defaultValue={params.visibility || ""} name="visibility">
                <option value="">All</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </label>
            <button className="btn-primary" type="submit">Filter</button>
          </div>
        </form>

        {/* Table */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-auto">
            <table className="w-full min-w-[1300px] table-fixed text-sm">
              <colgroup>
                <col className="w-[330px]" />
                <col className="w-[120px]" />
                <col className="w-[220px]" />
                <col className="w-[100px]" />
                <col className="w-[130px]" />
                <col className="w-[105px]" />
                <col className="w-[120px]" />
                <col className="w-[105px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Unit price</th>
                  <th className="px-5 py-3">Availability</th>
                  <th className="px-5 py-3">Visibility</th>
                  <th className="px-5 py-3">Stripe</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {productList.map((product) => (
                  <tr key={product.id} className="table-row-hover border-b border-slate-100 last:border-b-0 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 bg-white object-contain"
                          src={product.image_url || "/images/product-placeholder.svg"}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-900" title={product.name}>{product.name}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500" title={product.description || ""}>
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="block max-w-full truncate font-semibold text-slate-700" title={product.category}>
                        {product.category}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="block max-w-full truncate font-mono text-[11px] font-semibold text-slate-600" title={product.sku}>
                        {product.sku}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-black">{formatMoney(product.unit_price)}</td>
                    <td className="px-5 py-3"><span className="badge max-w-full justify-center text-center">{product.availability_status}</span></td>
                    <td className="px-5 py-3">
                      {product.is_hidden ? (
                        <span className="badge justify-center border-slate-300 bg-slate-100 text-slate-600">Hidden</span>
                      ) : (
                        <span className="badge justify-center border-emerald-200 bg-emerald-50 text-emerald-800">Visible</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {product.stripe_sync_status === "synced" ? (
                        <span className="badge justify-center border-emerald-200 bg-emerald-50 text-emerald-800">Synced</span>
                      ) : product.stripe_sync_status === "failed" ? (
                        <span className="badge justify-center border-red-200 bg-red-50 text-red-700">Failed</span>
                      ) : (
                        <span className="badge justify-center border-amber-200 bg-amber-50 text-amber-800">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link className="btn-secondary min-h-8 px-3 text-xs" href={`/admin/products/${product.id}`}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!productList.length && (
            <div className="p-12 text-center">
              <p className="font-bold text-slate-500">No products match this filter.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
