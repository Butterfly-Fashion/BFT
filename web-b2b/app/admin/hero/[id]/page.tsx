import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { HeroBannerEditForm } from "@/components/admin/hero-banner-edit-form";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { HeroBanner } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditHeroBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("hero_banners").select("*").eq("id", id).single();
  if (!data) notFound();

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <HeroBannerEditForm banner={data as HeroBanner} />
      </main>
    </>
  );
}
