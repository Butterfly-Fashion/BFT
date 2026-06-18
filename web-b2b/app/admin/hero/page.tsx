import Link from "next/link";
import { Plus, Eye, EyeOff, Pencil, ExternalLink, ArrowUpRight } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { toggleHeroBannerPublishedAction, deleteHeroBannerAction } from "@/app/actions";
import type { HeroBanner } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminHeroPage() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("hero_banners")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const banners = (data || []) as HeroBanner[];
  const publishedCount = banners.filter((b) => b.is_published).length;

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label">Content management</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Hero banners</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Upload announcement images for the homepage hero. Published banners rotate in sort order.
              When none are published, the default text hero is shown instead.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="btn-secondary min-h-8 gap-1.5 px-3 text-xs"
            >
              <ExternalLink size={12} /> Preview
            </Link>
            <Link className="btn-primary gap-1.5 text-xs" href="/admin/hero/new">
              <Plus size={13} /> Upload banner
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-500">Total banners</p>
            <strong className="mt-2 block text-2xl">{banners.length}</strong>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-500">Published</p>
            <strong className="mt-2 block text-2xl text-emerald-600">{publishedCount}</strong>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-500">Hidden</p>
            <strong className="mt-2 block text-2xl text-slate-400">{banners.length - publishedCount}</strong>
          </div>
        </section>

        {/* Grid */}
        {banners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
            <p className="font-bold text-slate-400">No banners yet.</p>
            <p className="mt-1 text-sm text-slate-400">Upload your first hero banner to get started.</p>
            <Link className="btn-primary mt-4 gap-1.5 text-sm" href="/admin/hero/new">
              <Plus size={14} /> Upload banner
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {banners.map((banner) => (
              <div key={banner.id} className="card overflow-hidden">
                <div className="relative bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full object-cover"
                    style={{ aspectRatio: "16/9" }}
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                    #{banner.sort_order}
                  </span>
                  {!banner.is_published && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        Hidden
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-bold text-slate-900">{banner.title}</p>
                  {banner.subtitle && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{banner.subtitle}</p>
                  )}
                  {banner.link_url && (
                    <p className="mt-1 flex items-center gap-1 truncate text-[11px] font-semibold text-(--primary)">
                      <ArrowUpRight size={11} className="shrink-0" /> {banner.link_url}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      href={`/admin/hero/${banner.id}`}
                      className="btn-secondary min-h-7 flex-1 gap-1 px-2 text-xs"
                    >
                      <Pencil size={11} /> Edit
                    </Link>
                    <form action={toggleHeroBannerPublishedAction.bind(null, banner.id, !banner.is_published)}>
                      <button
                        type="submit"
                        title={banner.is_published ? "Hide" : "Publish"}
                        className="btn-secondary min-h-7 px-2"
                      >
                        {banner.is_published
                          ? <EyeOff size={13} className="text-slate-500" />
                          : <Eye size={13} className="text-emerald-600" />
                        }
                      </button>
                    </form>
                    <form action={deleteHeroBannerAction.bind(null, banner.id)}>
                      <button
                        type="submit"
                        title="Delete"
                        className="btn-danger min-h-7 px-2 text-xs"
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
