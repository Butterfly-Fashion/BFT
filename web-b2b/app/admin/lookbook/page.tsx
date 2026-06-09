import Link from "next/link";
import { Plus, Eye, EyeOff, Pencil, ExternalLink } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { toggleLookbookPublishedAction, deleteLookbookItemAction } from "@/app/actions";
import type { LookbookItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminLookbookPage() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("lookbook_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const items = (data || []) as LookbookItem[];
  const publishedCount = items.filter((i) => i.is_published).length;

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label">Content management</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Lookbook</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Upload banner images and campaign visuals. Published items appear on the public lookbook page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/lookbook"
              target="_blank"
              className="btn-secondary min-h-8 gap-1.5 px-3 text-xs"
            >
              <ExternalLink size={12} /> Preview
            </Link>
            <Link className="btn-primary gap-1.5 text-xs" href="/admin/lookbook/new">
              <Plus size={13} /> Upload image
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-500">Total images</p>
            <strong className="mt-2 block text-2xl">{items.length}</strong>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-500">Published</p>
            <strong className="mt-2 block text-2xl text-emerald-600">{publishedCount}</strong>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-500">Hidden</p>
            <strong className="mt-2 block text-2xl text-slate-400">{items.length - publishedCount}</strong>
          </div>
        </section>

        {/* Grid */}
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
            <p className="font-bold text-slate-400">No images yet.</p>
            <p className="mt-1 text-sm text-slate-400">Upload your first lookbook image to get started.</p>
            <Link className="btn-primary mt-4 gap-1.5 text-sm" href="/admin/lookbook/new">
              <Plus size={14} /> Upload image
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="card overflow-hidden">
                <div className="relative bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full object-cover"
                    style={{ aspectRatio: "4/3" }}
                  />
                  {!item.is_published && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        Hidden
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  {item.season && (
                    <span className="mb-1 inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.season}
                    </span>
                  )}
                  <p className="truncate text-sm font-bold text-slate-900">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{item.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      href={`/admin/lookbook/${item.id}`}
                      className="btn-secondary min-h-7 flex-1 gap-1 px-2 text-xs"
                    >
                      <Pencil size={11} /> Edit
                    </Link>
                    <form action={toggleLookbookPublishedAction.bind(null, item.id, !item.is_published)}>
                      <button
                        type="submit"
                        title={item.is_published ? "Hide" : "Publish"}
                        className="btn-secondary min-h-7 px-2"
                      >
                        {item.is_published
                          ? <EyeOff size={13} className="text-slate-500" />
                          : <Eye size={13} className="text-emerald-600" />
                        }
                      </button>
                    </form>
                    <form action={deleteLookbookItemAction.bind(null, item.id)}>
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
