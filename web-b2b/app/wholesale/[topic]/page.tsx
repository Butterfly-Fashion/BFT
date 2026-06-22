import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { BackToTop } from "@/components/store/back-to-top";
import { getCurrentProfile } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import { WHOLESALE_LANDINGS, getWholesaleLanding } from "@/lib/wholesale-landing";

export const dynamic = "force-static";

export function generateStaticParams() {
  return WHOLESALE_LANDINGS.map((l) => ({ topic: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const { topic } = await params;
  const landing = getWholesaleLanding(topic);
  if (!landing) return { title: "Wholesale" };
  return {
    title: landing.metaTitle,
    description: landing.metaDescription,
    alternates: { canonical: `/wholesale/${landing.slug}` },
    openGraph: { title: landing.metaTitle, description: landing.metaDescription, url: `/wholesale/${landing.slug}` },
  };
}

export default async function WholesaleLandingPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const landing = getWholesaleLanding(topic);
  if (!landing) notFound();
  const profile = await getCurrentProfile();
  const base = siteUrl();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: landing.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: landing.h1, item: `${base}/wholesale/${landing.slug}` },
    ],
  };

  return (
    <>
      <Header profile={profile} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className="container-shell py-10">
        <p className="section-label">Wholesale · Canada</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-black leading-tight text-slate-950">{landing.h1}</h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600">{landing.intro}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/wholesale-catalog" className="btn-primary">Request wholesale catalog</Link>
          <Link href="/products" className="btn-secondary">Browse products</Link>
        </div>

        <section className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-black text-slate-900">Why buy from us</h2>
            <ul className="mt-4 grid gap-2.5">
              {landing.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm font-semibold text-slate-700">
                  <Check size={18} className="mt-0.5 shrink-0 text-green-600" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Who we supply</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {landing.buyers.map((b) => (
                <li key={b} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-black text-slate-900">Frequently asked questions</h2>
          <div className="mt-4 grid gap-3">
            {landing.faqs.map((f) => (
              <div key={f.q} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="font-bold text-slate-900">{f.q}</p>
                <p className="mt-1.5 text-sm text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <h2 className="text-2xl font-black text-slate-950">Ready to order at wholesale pricing?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            Request our catalog and we&apos;ll send current bulk pricing for your volume.
          </p>
          <div className="mt-5">
            <Link href="/wholesale-catalog" className="btn-primary">Request wholesale catalog</Link>
          </div>
        </section>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
