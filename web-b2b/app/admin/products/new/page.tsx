import { AdminNav } from "@/components/admin/admin-nav";
import { ProductForm } from "@/components/admin/product-form";
import { fetchAllCategories } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function AdminProductNewPage() {
  const categories = await fetchAllCategories();
  return (
    <>
      <AdminNav />
      <main className="container-shell py-6">
        <ProductForm mode="create" categories={categories} />
      </main>
    </>
  );
}
