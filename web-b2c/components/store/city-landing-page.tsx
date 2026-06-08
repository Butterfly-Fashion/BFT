import type { ReactNode } from "react";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { ProductCard } from "@/components/store/product-card";
import {
  breadcrumbJsonLd,
  jsonLd,
  BUSINESS_LOCALITY,
  BUSINESS_POSTAL_CODE,
  BUSINESS_REGION,
  BUSINESS_STREET_ADDRESS,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

export interface CityFaq {
  q: string;
  a: string;
}

export interface CityReason {
  icon: string;
  title: string;
  body: string;
}

export interface CityMatch {
  date: string;
  teams: string;
  venue: string;
}

export interface CityHostInfo {
  badge: string;
  venueName: string;
  matches: CityMatch[];
  note: string;
}

export interface CityNarrative {
  eyebrow: string;
  title: ReactNode;
  leftParagraphs: ReactNode[];
  rightParagraphs: ReactNode[];
  links: { href: string; label: string }[];
}

export interface CityLocalBusiness {
  description: string;
  areaServedState: string;
  telephone?: string;
  geo?: { latitude: number; longitude: number };
  openingHoursSpecification?: {
    dayOfWeek: string[];
    opens: string;
    closes: string;
  };
}

export interface CityPageConfig {
  slug: string;
  cityName: string;
  heroBadge: string;
  heroTitle: ReactNode;
  heroSubtitle: string;
  secondaryCta: { href: string; label: string };
  reasons: CityReason[];
  hostCity?: CityHostInfo;
  narrative: CityNarrative;
  faqHeading: string;
  faqs: CityFaq[];
  localBusiness: CityLocalBusiness;
}

function faqJsonLd(faqs: CityFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export async function CityLandingPage({ config }: { config: CityPageConfig }) {
  const allProducts = await getAllProducts();
  const featured = allProducts.filter((p) => p.inStock).slice(0, 12);

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: config.cityName, url: `/${config.slug}` },
  ]);

  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#local`,
    name: SITE_NAME,
    description: config.localBusiness.description,
    url: SITE_URL,
    ...(config.localBusiness.telephone !== undefined ? { telephone: config.localBusiness.telephone } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS_STREET_ADDRESS,
      addressLocality: BUSINESS_LOCALITY,
      addressRegion: BUSINESS_REGION,
      postalCode: BUSINESS_POSTAL_CODE,
      addressCountry: "CA",
    },
    ...(config.localBusiness.geo
      ? { geo: { "@type": "GeoCoordinates", ...config.localBusiness.geo } }
      : {}),
    areaServed: [
      { "@type": "City", name: config.cityName },
      { "@type": "State", name: config.localBusiness.areaServedState },
      { "@type": "Country", name: "Canada" },
    ],
    priceRange: "$10 – $35 CAD",
    ...(config.localBusiness.openingHoursSpecification
      ? {
          openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            ...config.localBusiness.openingHoursSpecification,
          },
        }
      : {}),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd(config.faqs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(localBusinessLd) }} />

      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">{config.heroBadge}</p>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">{config.heroTitle}</h1>
        <p className="text-base text-gray-500 leading-relaxed mb-6">{config.heroSubtitle}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/products"
            className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-hover transition-colors"
          >
            Shop All In-Stock Gear →
          </Link>
          <Link
            href={config.secondaryCta.href}
            className="rounded-full border border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 hover:border-gray-400 transition-colors"
          >
            {config.secondaryCta.label}
          </Link>
        </div>
      </div>

      {/* Why buy from us */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
        {config.reasons.map((r) => (
          <div key={r.title} className="rounded-xl border border-gray-100 bg-gray-50 p-5">
            <div className="text-2xl mb-3">{r.icon}</div>
            <h2 className="text-sm font-bold text-gray-900 mb-1.5">{r.title}</h2>
            <p className="text-xs leading-5 text-gray-500">{r.body}</p>
          </div>
        ))}
      </div>

      {/* Host city callout */}
      {config.hostCity && (
        <div className="rounded-2xl bg-[#003876] text-white p-6 sm:p-8 mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-2">{config.hostCity.badge}</p>
          <h2 className="text-xl font-black mb-4">Matches at {config.hostCity.venueName}</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {config.hostCity.matches.map((m) => (
              <div key={m.date} className="rounded-xl bg-white/10 p-4">
                <p className="text-xs font-bold text-blue-200 mb-1">{m.date}</p>
                <p className="text-sm font-semibold">{m.teams}</p>
                <p className="text-xs text-blue-200 mt-1">{m.venue}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-blue-200">{config.hostCity.note}</p>
        </div>
      )}

      {/* Products */}
      <div className="mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-2">In Stock Now</p>
        <h2 className="text-2xl font-black text-gray-900 mb-6">Shop World Cup 2026 Fan Gear</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/products"
            className="inline-block rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-500 transition-colors"
          >
            View All Products →
          </Link>
        </div>
      </div>

      {/* Narrative */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-2">{config.narrative.eyebrow}</p>
        <h2 className="text-xl font-black text-gray-900 mb-4">{config.narrative.title}</h2>
        <div className="grid sm:grid-cols-2 gap-6 text-sm text-gray-600 leading-7">
          <div className="space-y-4">
            {config.narrative.leftParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="space-y-4">
            {config.narrative.rightParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {config.narrative.links.map((link) => (
            <Link key={link.href} href={link.href} className="text-xs font-semibold text-brand hover:underline">
              → {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-14">
        <h2 className="text-xl font-black text-gray-900 mb-6">{config.faqHeading}</h2>
        <div className="space-y-4">
          {config.faqs.map((faq) => (
            <div key={faq.q} className="rounded-xl border border-gray-100 bg-white p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-xs leading-6 text-gray-500">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
