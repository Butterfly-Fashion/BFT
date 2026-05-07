import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { ProductForm } from "@/components/admin/product-form";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: product } = await admin.from("products").select("*").eq("id", id).single();
  if (!product) notFound();

  return (
    <>
      <AdminNav />
      <main className="container-shell py-6">
        <ProductForm mode="edit" product={product} />
      </main>
    </>
  );
}
