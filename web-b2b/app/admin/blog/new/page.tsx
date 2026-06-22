import { AdminNav } from "@/components/admin/admin-nav";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { createBlogPostAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default function NewBlogPostPage() {
  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <div className="mb-5">
          <p className="section-label">Content</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">New blog post</h1>
        </div>
        <BlogPostForm action={createBlogPostAction} />
      </main>
    </>
  );
}
