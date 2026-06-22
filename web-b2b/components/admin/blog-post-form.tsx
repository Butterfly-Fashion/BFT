"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BlogEditor } from "@/components/admin/blog-editor";
import type { BlogPost } from "@/lib/types";

type BlogState = { error?: string } | null;
type Action = (prev: BlogState, formData: FormData) => Promise<BlogState>;

export function BlogPostForm({ action, post }: { action: Action; post?: BlogPost }) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="grid gap-5 lg:grid-cols-[1fr_320px]">
      {post && <input type="hidden" name="post_id" value={post.id} />}

      {/* Main column */}
      <div className="grid gap-4">
        <section className="card p-5">
          <label className="label">
            Title *
            <input className="field text-lg font-bold" name="title" defaultValue={post?.title || ""} required placeholder="e.g. How to Choose Wholesale Winter Gloves for Your Store" />
          </label>
          <label className="label mt-3">
            Excerpt (1–2 sentences, shown on the blog list)
            <textarea className="field min-h-16" name="excerpt" defaultValue={post?.excerpt || ""} placeholder="A short summary that hooks the reader and appears in search results." />
          </label>
        </section>

        <section className="card p-0 overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3">
            <p className="text-sm font-bold text-slate-700">Article body</p>
          </div>
          <div className="p-3">
            <BlogEditor name="body_html" defaultValue={post?.body_html || ""} />
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <aside className="grid h-fit gap-4">
        <section className="card p-5 grid gap-3">
          <label className="label">
            Status
            <select className="field" name="status" defaultValue={post?.status || "draft"}>
              <option value="draft">Draft (hidden)</option>
              <option value="published">Published (live)</option>
            </select>
          </label>
          <label className="label">
            Category
            <input className="field" name="category" defaultValue={post?.category || ""} placeholder="e.g. Buyer Guide" />
          </label>
          {state?.error && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{state.error}</p>
          )}
          <button className="btn-primary" type="submit" disabled={pending}>
            {pending ? "Saving…" : post ? "Save changes" : "Create post"}
          </button>
          <Link className="btn-secondary text-center" href="/admin/blog">Cancel</Link>
        </section>

        <section className="card p-5 grid gap-3">
          <p className="text-sm font-bold text-slate-700">Cover image</p>
          {post?.cover_image_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={post.cover_image_url} alt="cover" className="aspect-video w-full rounded-lg border border-slate-200 object-cover" />
          )}
          <input className="field" name="cover_image" type="file" accept="image/*" />
          <p className="text-xs text-slate-400">Optional. Shown at the top of the post and on the blog list. Max 5 MB.</p>
        </section>

        <section className="card p-5 grid gap-3">
          <label className="label">
            Slug (URL)
            <input className="field font-mono text-sm" name="slug" defaultValue={post?.slug || ""} placeholder="auto from title" />
          </label>
          <label className="label">
            Meta description (SEO)
            <textarea className="field min-h-16 text-sm" name="meta_description" defaultValue={post?.meta_description || ""} placeholder="~155 chars shown in Google results. Defaults to the excerpt if blank." />
          </label>
        </section>
      </aside>
    </form>
  );
}
