import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { LookbookEditForm } from "@/components/admin/lookbook-edit-form";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { LookbookItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditLookbookItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("lookbook_items").select("*").eq("id", id).single();
  if (!data) notFound();

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <LookbookEditForm item={data as LookbookItem} />
      </main>
    </>
  );
}
