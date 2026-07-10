import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { BackToTop } from "@/components/store/back-to-top";
import { getCurrentProfile } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getPost(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    // Scheduled publishing: future-dated posts stay hidden until their time.
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article" };
  const description = post.meta_description || post.excerpt || undefined;
  return {
    title: { absolute: post.title },
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: `/blog/${post.slug}`,
      ...(post.cover_image_url ? { images: [post.cover_image_url] } : {}),
    },
  };
}

async function getRelatedPosts(category: string | null, excludeSlug: string) {
  if (!category) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt")
    .eq("status", "published")
    .eq("category", category)
    .neq("slug", excludeSlug)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(3);
  return data || [];
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const [profile, related] = await Promise.all([
    getCurrentProfile(),
    getRelatedPosts(post.category, post.slug),
  ]);
  const base = siteUrl();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description || post.excerpt || undefined,
    ...(post.cover_image_url ? { image: post.cover_image_url } : {}),
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: "Butterfly Fashion Trading" },
    publisher: { "@type": "Organization", name: "Butterfly Fashion Trading" },
    mainEntityOfPage: `${base}/blog/${post.slug}`,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${base}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${base}/blog/${post.slug}` },
    ],
  };

  return (
    <>
      <Header profile={profile} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className="container-shell py-10">
        <article className="mx-auto max-w-3xl">
          <Link href="/blog" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
            <ChevronLeft size={13} /> All guides
          </Link>

          {post.category && <p className="text-xs font-black uppercase tracking-wide text-(--primary)">{post.category}</p>}
          <h1 className="mt-2 text-4xl font-black leading-tight text-slate-950">{post.title}</h1>
          {post.published_at && (
            <p className="mt-3 text-sm text-slate-400">
              {new Date(post.published_at).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}

          {post.cover_image_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={post.cover_image_url} alt={post.title} className="mt-6 aspect-video w-full rounded-2xl border border-slate-200 object-cover" />
          )}

          <div className="blog-content mt-8" dangerouslySetInnerHTML={{ __html: post.body_html || "" }} />

          {/* Related guides — same-category internal links for readers and crawlers */}
          {related.length > 0 && (
            <div className="mt-12 border-t border-slate-200 pt-8">
              <h2 className="text-lg font-black text-slate-950">More {post.category} guides</h2>
              <ul className="mt-4 grid gap-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/blog/${r.slug}`} className="group block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
                      <p className="font-bold text-slate-900 group-hover:underline">{r.title}</p>
                      {r.excerpt && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{r.excerpt}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
            <h2 className="text-xl font-black text-slate-950">Buy this wholesale</h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
              Request our catalog for bulk pricing, or browse the full range.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href="/wholesale-catalog" className="btn-primary">Request catalog</Link>
              <Link href="/products" className="btn-secondary">Browse products</Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
