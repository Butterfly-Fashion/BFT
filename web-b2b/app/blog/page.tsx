import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { BackToTop } from "@/components/store/back-to-top";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wholesale Guides & Blog",
  description:
    "Buyer guides and wholesale tips from Butterfly Fashion Trading — sourcing, bulk pricing, and product know-how for Canadian retailers.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage() {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, cover_image_url, category, published_at")
    .eq("status", "published")
    // Scheduled publishing: future-dated posts stay hidden until their time.
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });
  const list = posts || [];

  return (
    <>
      <Header profile={profile} />
      <main className="container-shell py-10">
        <div className="mb-8 max-w-2xl">
          <p className="section-label">Guides &amp; blog</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-slate-950">Wholesale buyer guides</h1>
          <p className="mt-3 text-base text-slate-600">
            Sourcing tips, bulk-buying advice, and product know-how for Canadian retailers.
          </p>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <p className="font-bold text-slate-500">No articles yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
              >
                <div className="aspect-video w-full overflow-hidden bg-slate-100">
                  {post.cover_image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={post.cover_image_url} alt={post.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">Butterfly Fashion</div>
                  )}
                </div>
                <div className="p-5">
                  {post.category && <p className="mb-1.5 text-xs font-black uppercase tracking-wide text-(--primary)">{post.category}</p>}
                  <h2 className="text-lg font-black leading-snug text-slate-900">{post.title}</h2>
                  {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-slate-500">{post.excerpt}</p>}
                  {post.published_at && (
                    <p className="mt-3 text-xs text-slate-400">{new Date(post.published_at).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
