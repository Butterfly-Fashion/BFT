import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { DangerForm } from "@/components/admin/danger-form";
import { deleteBlogPostAction, toggleBlogPublishedAction } from "@/app/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const admin = createSupabaseAdminClient();
  const { data: posts, error } = await admin
    .from("blog_posts")
    .select("id, title, slug, status, category, published_at, updated_at")
    .order("updated_at", { ascending: false });
  const list = posts || [];

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label">Content</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Blog &amp; guides</h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              Write buyer guides to rank for wholesale searches and get cited by AI search.
            </p>
          </div>
          <Link className="btn-primary gap-1.5 text-xs" href="/admin/blog/new"><Plus size={13} /> New post</Link>
        </section>

        {error ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Run migration <code>013_blog_posts.sql</code> in Supabase to enable the blog.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-200 text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Updated</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((post) => (
                  <tr key={post.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900">{post.title}</p>
                      <p className="font-mono text-xs text-slate-400">/blog/{post.slug}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{post.category || "—"}</td>
                    <td className="px-5 py-3">
                      {post.status === "published"
                        ? <span className="badge border-emerald-200 bg-emerald-50 text-emerald-800">Published</span>
                        : <span className="badge border-slate-200 bg-slate-100 text-slate-600">Draft</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{new Date(post.updated_at).toLocaleDateString("en-CA")}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <form action={async () => { "use server"; await toggleBlogPublishedAction(post.id, post.status !== "published"); }}>
                          <button className="btn-secondary min-h-8 px-3 text-xs" type="submit">
                            {post.status === "published" ? "Unpublish" : "Publish"}
                          </button>
                        </form>
                        <Link className="btn-secondary min-h-8 px-3 text-xs" href={`/admin/blog/${post.id}`}>Edit</Link>
                        <DangerForm
                          action={deleteBlogPostAction.bind(null, post.id)}
                          confirmMessage={`Delete "${post.title}"? This cannot be undone.`}
                          submitLabel="Delete"
                          className="contents"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.length && (
              <div className="p-12 text-center">
                <p className="font-bold text-slate-500">No posts yet.</p>
                <p className="mt-1 text-sm text-slate-400">Write your first buyer guide to start ranking on Google.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
