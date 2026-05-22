import { ProductCard } from "@/components/store/product-card";
import { getBlogPost, getPostProducts, isPostPublished } from "@/lib/blog-posts";
import { absoluteUrl, breadcrumbJsonLd, jsonLd } from "@/lib/seo";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  const canonical = `/blog/${post.slug}`;
  const published = isPostPublished(post);

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical,
    },
    robots: published
      ? undefined
      : {
          index: false,
          follow: false,
        },
    openGraph: {
      title: post.title,
      description: post.description,
      url: absoluteUrl(canonical),
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      images: [{ url: absoluteUrl(post.heroImage) }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [absoluteUrl(post.heroImage)],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post || !isPostPublished(post)) notFound();

  const relatedProducts = getPostProducts(post);
  const canonical = `/blog/${post.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: [absoluteUrl(post.heroImage)],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      "@type": "Organization",
      name: "World Fan Gear",
    },
    publisher: {
      "@type": "Organization",
      name: "World Fan Gear",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/asset/logo.jpg"),
      },
    },
    mainEntityOfPage: absoluteUrl(canonical),
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.title, url: canonical },
  ]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }}
      />

      <article className="mx-auto max-w-3xl">
        <nav className="mb-5 text-xs text-gray-400">
          <Link href="/blog" className="hover:text-gray-700">
            Blog
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-600">{post.category}</span>
        </nav>

        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
          {post.category}
        </p>
        <h1 className="text-3xl font-black leading-tight text-gray-900 sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-5 text-base leading-8 text-gray-600">{post.description}</p>
        <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-gray-400">
          {new Intl.DateTimeFormat("en-CA", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }).format(new Date(`${post.publishedAt}T00:00:00-04:00`))}
        </p>

        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl bg-gray-100">
          <Image
            src={post.heroImage}
            alt={post.heroAlt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>

        <div className="mt-10 space-y-10">
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-black text-gray-900">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-gray-600">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA banner */}
        <div className="mt-12 rounded-2xl bg-[#C41E3A] px-6 py-8 text-center sm:px-10">
          <p className="text-xs font-bold uppercase tracking-widest text-red-200">
            World Fan Gear
          </p>
          <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">
            Ready to rep your team at Canada 2026?
          </h2>
          <p className="mt-2 text-sm text-red-100">
            Caps, bucket hats, car flags &amp; more — shipped from Toronto.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-block rounded-full bg-white px-7 py-3 text-sm font-black text-[#C41E3A] transition-opacity hover:opacity-90"
          >
            Shop Fan Gear →
          </Link>
        </div>

        <section className="mt-12 rounded-xl border border-gray-100 bg-white p-6">
          <h2 className="text-xl font-black text-gray-900">Quick answers</h2>
          <div className="mt-5 space-y-5">
            {post.faqs.map((faq) => (
              <div key={faq.q}>
                <h3 className="text-sm font-bold text-gray-900">{faq.q}</h3>
                <p className="mt-2 text-sm leading-7 text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </article>

      <section className="mt-16 border-t border-gray-100 pt-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
              Related Gear
            </p>
            <h2 className="mt-2 text-2xl font-black text-gray-900">Shop the guide</h2>
          </div>
          <Link href="/products" className="hidden text-sm font-bold text-gray-500 hover:text-gray-900 sm:block">
            View all products
          </Link>
        </div>
        {relatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-6 py-8 text-center">
            <p className="text-sm text-gray-500">Browse our full collection of Canada 2026 fan gear.</p>
            <Link
              href="/products"
              className="mt-4 inline-block rounded-full border border-gray-300 px-6 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:border-[#C41E3A] hover:text-[#C41E3A]"
            >
              View all products
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
