import { getPublishedPosts, getPostListImage } from "@/lib/blog-posts";
import { absoluteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "World Cup 2026 Fan Gear Blog",
  description:
    "World Cup 2026 fan gear guides, Canada watch party ideas, soccer gift guides, and match-day shopping tips.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "World Cup 2026 Fan Gear Blog",
    description:
      "Canada-focused guides for World Cup 2026 fan gear, gifts, watch parties, and match-day style.",
    url: absoluteUrl("/blog"),
    type: "website",
  },
};

export default function BlogIndexPage() {
  const posts = getPublishedPosts();

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <section className="max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand">
          Guides
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
          World Cup 2026 Fan Gear Blog
        </h1>
        <p className="mt-4 text-sm leading-7 text-gray-600">
          Canada-focused guides for match-day outfits, watch parties, car flags, gifts, and
          soccer fan merchandise before the 2026 tournament rush.
        </p>
      </section>

      <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-[16/10] bg-gray-100">
              <Image
                src={getPostListImage(post)}
                alt={post.heroAlt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
                {post.category}
              </p>
              <h2 className="mt-2 text-lg font-black leading-snug text-gray-900 group-hover:text-brand">
                {post.title}
              </h2>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                {post.description}
              </p>
              <p className="mt-4 text-xs font-semibold text-gray-400">
                {new Intl.DateTimeFormat("en-CA", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(`${post.publishedAt}T00:00:00-04:00`))}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
