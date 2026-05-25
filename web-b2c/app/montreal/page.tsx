import type { Metadata } from "next";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { ProductCard } from "@/components/store/product-card";
import { absoluteUrl, breadcrumbJsonLd, jsonLd, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "World Cup 2026 Fan Gear Montreal — Ships Across Quebec",
  description:
    "Shop World Cup 2026 fan gear in Montreal. Caps, bucket hats, car flags, Panini sticker packs shipped from Toronto to Montreal in 2–3 business days. Morocco, Argentina, Italy and more in stock.",
  keywords: [
    "World Cup 2026 Montreal fan gear",
    "World Cup 2026 merchandise Montreal Quebec",
    "FIFA 2026 Montreal in stock",
    "World Cup 2026 Montreal caps",
    "World Cup 2026 car flags Montreal",
    "Panini stickers Montreal",
    "World Cup Montreal shop Quebec",
    "FIFA 2026 gear livraison Montréal",
  ],
  alternates: {
    canonical: "/montreal",
  },
  openGraph: {
    title: "World Cup 2026 Fan Gear Montreal — In Stock",
    description:
      "In-stock World Cup 2026 fan gear shipped to Montreal in 2–3 business days. Caps, car flags, bucket hats, Panini sticker packs. CAD pricing, no duties.",
    url: absoluteUrl("/montreal"),
    type: "website",
  },
};

const FAQS = [
  {
    q: "Where can I buy World Cup 2026 merchandise in Montreal?",
    a: "World Fan Gear ships World Cup 2026 merchandise from our Toronto-area warehouse to Montreal in 2–3 business days via Canada Post Expedited. Order by June 9 to receive before opening day.",
  },
  {
    q: "Is World Cup 2026 fan gear available for Montreal fans right now?",
    a: "Yes — our full catalog is in stock and ready to ship to Quebec. Caps, bucket hats, car flags, Panini sticker packs, and mini boxing gloves for all major nations.",
  },
  {
    q: "Is Montreal a World Cup 2026 host city?",
    a: "Montreal is not an official FIFA World Cup 2026 host venue. The Canadian host cities are Toronto (BMO Field) and Vancouver (BC Place). However, Montreal is planning major outdoor screening events.",
  },
  {
    q: "How long does shipping to Montreal take?",
    a: "Orders from our North York warehouse typically arrive in 2–3 business days to Montreal via Canada Post Expedited. All prices are in CAD with no hidden duties.",
  },
  {
    q: "What World Cup teams are most popular in Montreal?",
    a: "Morocco, Algeria, Argentina, Italy, Brazil, and Canada are among the most followed teams in Montreal's diverse communities.",
  },
];

function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

const MONTREAL_REASONS = [
  {
    icon: "🚀",
    title: "Ships in 2–3 days",
    body: "Toronto to Montreal is our fastest route outside Ontario. Orders arrive in 2–3 business days via Canada Post Expedited. Order by June 9 for pre-kickoff delivery.",
  },
  {
    icon: "✅",
    title: "In stock now",
    body: "Our full catalog is stocked and ready. Caps, bucket hats, car flags, Panini sticker packs, and mini boxing gloves for all 48 nations.",
  },
  {
    icon: "💰",
    title: "CAD pricing, no duties",
    body: "Everything is priced in Canadian dollars. No USD conversion, no import fees. Clear pricing from the first page.",
  },
  {
    icon: "🌍",
    title: "Morocco, Algeria, Italy & more",
    body: "Montreal's fan communities are some of the most passionate in Canada. We carry gear for every team that matters here.",
  },
];

export default async function MontrealPage() {
  const allProducts = await getAllProducts();
  const featured = allProducts.filter((p) => p.inStock).slice(0, 12);

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Montreal", url: "/montreal" },
  ]);

  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#local`,
    name: "World Fan Gear",
    description:
      "World Cup 2026 fan gear store shipping from Toronto to Montreal and all of Quebec. Caps, bucket hats, car flags, Panini sticker packs.",
    url: SITE_URL,
    address: {
      "@type": "PostalAddress",
      streetAddress: "178 Bentworth Ave",
      addressLocality: "North York",
      addressRegion: "ON",
      postalCode: "M6A 1P7",
      addressCountry: "CA",
    },
    areaServed: [
      { "@type": "City", name: "Montreal" },
      { "@type": "State", name: "Quebec" },
      { "@type": "Country", name: "Canada" },
    ],
    priceRange: "$10 – $35 CAD",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(localBusinessLd) }} />

      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A] mb-3">
          Montreal · Ships to Quebec · June 2026
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
          World Cup 2026 Fan Gear<br className="hidden sm:block" /> in Montreal
        </h1>
        <p className="text-base text-gray-500 leading-relaxed mb-6">
          Shop fan gear for all 48 nations — shipped from Toronto to Montreal in 2–3 business days.
          Caps, bucket hats, car flags, Panini sticker packs in stock now.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/products"
            className="rounded-full bg-[#C41E3A] px-6 py-3 text-sm font-bold text-white hover:bg-[#A01830] transition-colors"
          >
            Shop All In-Stock Gear →
          </Link>
          <Link
            href="/collections/panini-stickers"
            className="rounded-full border border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 hover:border-gray-400 transition-colors"
          >
            Shop Panini Stickers
          </Link>
        </div>
      </div>

      {/* Why buy from us */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
        {MONTREAL_REASONS.map((r) => (
          <div key={r.title} className="rounded-xl border border-gray-100 bg-gray-50 p-5">
            <div className="text-2xl mb-3">{r.icon}</div>
            <h2 className="text-sm font-bold text-gray-900 mb-1.5">{r.title}</h2>
            <p className="text-xs leading-5 text-gray-500">{r.body}</p>
          </div>
        ))}
      </div>

      {/* Products */}
      <div className="mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A] mb-2">In Stock Now</p>
        <h2 className="text-2xl font-black text-gray-900 mb-6">Shop World Cup 2026 Fan Gear</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
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

      {/* Montreal context */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A] mb-2">
          One of the most passionate soccer cities in Canada
        </p>
        <h2 className="text-xl font-black text-gray-900 mb-4">
          Montréal&rsquo;s World Cup is in the streets
        </h2>
        <div className="grid sm:grid-cols-2 gap-6 text-sm text-gray-600 leading-7">
          <div className="space-y-4">
            <p>
              When Morocco plays, the energy on Saint-Laurent is unlike anywhere else in Canada.
              When Argentina plays, you can feel it in Little Italy. When Algeria or Haiti make a
              run, the whole city wakes up. Montreal doesn&rsquo;t just watch the World Cup — it
              lives it.
            </p>
            <p>
              The fan communities here are some of the most passionate on the continent. This is a
              city that has been waiting for the World Cup to come to North America for a long time.
            </p>
          </div>
          <div className="space-y-4">
            <p>
              We carry gear for all 48 nations — Morocco, Algeria, Argentina, Italy, Brazil, Haiti,
              Canada, and every other team in the tournament. Gear that works for a Plateau terrace
              or a Saint-Denis watch party.
            </p>
            <p>
              Ships from Toronto. Arrives in Montreal in 2–3 business days. All prices in CAD.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/blog/world-cup-2026-fan-gear-montreal" className="text-xs font-semibold text-[#C41E3A] hover:underline">
            → Montreal fan gear guide
          </Link>
          <Link href="/blog/world-cup-watch-parties-montreal" className="text-xs font-semibold text-[#C41E3A] hover:underline">
            → Where to watch in Montreal
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-14">
        <h2 className="text-xl font-black text-gray-900 mb-6">
          Common questions about World Cup 2026 fan gear in Montreal
        </h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
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
