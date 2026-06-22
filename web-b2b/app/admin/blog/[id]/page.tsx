import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { updateBlogPostAction } from "@/app/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: post } = await admin.from("blog_posts").select("*").eq("id", id).single();
  if (!post) notFound();

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <div className="mb-5">
          <p className="section-label">Content</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Edit blog post</h1>
        </div>
        <BlogPostForm action={updateBlogPostAction} post={post as BlogPost} />
      </main>
    </>
  );
}
