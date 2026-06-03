import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { ProductForm } from "@/components/admin/product-form";
import { DangerForm } from "@/components/admin/danger-form";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { fetchAllCategories } from "@/lib/categories";
import { duplicateProductAction, deleteProductAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const [{ data: product }, categories] = await Promise.all([
    admin.from("products").select("*").eq("id", id).single(),
    fetchAllCategories().catch((err) => {
      console.error("[admin product edit] failed to load categories", err);
      return [];
    }),
  ]);
  if (!product) notFound();

  return (
    <>
      <AdminNav />
      <main className="container-shell py-6">
        {/* Danger zone — above form */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">
            Item Code: <span className="font-mono text-slate-700">{product.sku}</span>
          </p>
          <div className="flex gap-2">
            <form action={duplicateProductAction.bind(null, product.id)}>
              <button type="submit" className="btn-secondary min-h-8 px-3 text-xs">
                Duplicate product
              </button>
            </form>
            <DangerForm
              action={deleteProductAction.bind(null, product.id)}
              confirmMessage={`Delete "${product.name}"?\n\nIf this product has order history, it will be hidden instead of deleted.`}
              submitLabel="Delete product"
              className="contents"
            />
          </div>
        </div>

        <ProductForm mode="edit" product={product} categories={categories} />
      </main>
    </>
  );
}
