import { AdminNav } from "@/components/admin/admin-nav";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default function AdminProductNewPage() {
  return (
    <>
      <AdminNav />
      <main className="container-shell py-6">
        <ProductForm mode="create" />
      </main>
    </>
  );
}
