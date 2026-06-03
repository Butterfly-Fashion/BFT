import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminProductsFilter } from "@/components/admin/products-filter";
import { AdminProductsTable } from "@/components/admin/products-table";
import { formatMoney } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; visibility?: string; channel?: string }>;
}) {
  const params = await searchParams;
  const admin = createSupabaseAdminClient();

  let query = admin.from("products").select("*").order("updated_at", { ascending: false });
  if (params.category) query = query.eq("category", params.category);
  if (params.visibility === "visible") query = query.eq("is_hidden", false);
  if (params.visibility === "hidden") query = query.eq("is_hidden", true);
  if (params.channel === "b2c") query = query.contains("sales_channels", ["b2c"]);
  if (params.channel === "b2b") query = query.contains("sales_channels", ["b2b"]);
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
  const b2cCount = all.filter((p) => (p.sales_channels || ["b2b"]).includes("b2c")).length;
  const b2bCount = all.filter((p) => (p.sales_channels || ["b2b"]).includes("b2b")).length;
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
        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            { label: "Total products", value: all.length },
            { label: "Visible", value: visibleCount },
            { label: "Hidden", value: hiddenCount },
            { label: "B2C Store", value: b2cCount },
            { label: "B2B Wholesale", value: b2bCount },
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
        <AdminProductsFilter
          categories={categories}
          initial={{
            q: params.q || "",
            category: params.category || "",
            visibility: params.visibility || "",
            channel: params.channel || "",
          }}
        />

        {/* Table */}
        <AdminProductsTable products={productList as any} />
      </main>
    </>
  );
}
