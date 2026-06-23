import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { BackToTop } from "@/components/store/back-to-top";
import { CatalogRequestForm } from "@/components/store/catalog-request-form";
import { getCurrentProfile } from "@/lib/auth";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request Wholesale Catalog",
  description:
    "Get the Butterfly Fashion Trading wholesale catalog and bulk pricing. Canadian inventory in Toronto, no minimum order, fast shipping across Canada & the USA.",
  alternates: { canonical: "/wholesale-catalog" },
  openGraph: {
    title: "Request Wholesale Catalog — Butterfly Fashion Trading",
    description: "Canadian wholesale supplier — bulk pricing, no minimum order, fast domestic shipping. Request the catalog.",
    url: "/wholesale-catalog",
  },
};

const POINTS = [
  "Wholesale pricing & bulk tiers",
  "Canadian inventory — stocked in Toronto",
  "No minimum order — any quantity",
  "Fast shipping across Canada & the USA",
  "Net terms for approved accounts",
];

export default async function WholesaleCatalogPage() {
  const profile = await getCurrentProfile();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Request Wholesale Catalog",
    url: `${siteUrl()}/wholesale-catalog`,
    about: "Wholesale catalog and bulk pricing request for Canadian retailers.",
    provider: { "@type": "Organization", name: "Butterfly Fashion Trading" },
  };

  return (
    <>
      <Header profile={profile} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="container-shell py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,460px)]">
          <div>
            <p className="section-label">Wholesale</p>
            <h1 className="mt-2 text-4xl font-black leading-tight text-slate-950">
              Get our wholesale catalog &amp; bulk pricing
            </h1>
            <p className="mt-3 max-w-xl text-base text-slate-600">
              Butterfly Fashion Trading is a Toronto-based wholesale supplier serving retailers across Canada and the
              USA. Tell us a bit about your business and we&apos;ll send the catalog with current bulk pricing.
            </p>
            <ul className="mt-6 grid gap-2.5">
              {POINTS.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm font-semibold text-slate-700">
                  <Check size={18} className="mt-0.5 shrink-0 text-green-600" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-bold text-slate-800">Who we supply</p>
              <p className="mt-1">
                Dollar &amp; variety stores, toy &amp; gift shops, convenience stores, arcades, and fundraiser organizers.
              </p>
            </div>
          </div>

          <div className="card h-fit p-6">
            <h2 className="mb-4 text-xl font-black text-slate-900">Request the catalog</h2>
            <CatalogRequestForm />
          </div>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
