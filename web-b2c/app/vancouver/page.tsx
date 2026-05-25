import type { Metadata } from "next";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { ProductCard } from "@/components/store/product-card";
import { absoluteUrl, breadcrumbJsonLd, jsonLd, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "World Cup 2026 Fan Gear Vancouver — In Stock, Ships to BC",
  description:
    "Shop World Cup 2026 fan gear in Vancouver. Caps, bucket hats, car flags, Panini sticker packs shipped from Toronto to BC in 3–5 business days. BC Place host city — gear up now.",
  keywords: [
    "World Cup 2026 Vancouver fan gear",
    "World Cup 2026 merchandise Vancouver BC",
    "FIFA 2026 Vancouver in stock",
    "BC Place World Cup 2026 gear",
    "World Cup 2026 Vancouver caps",
    "World Cup 2026 car flags Vancouver",
    "Panini stickers Vancouver",
    "World Cup Vancouver shop",
  ],
  alternates: {
    canonical: "/vancouver",
  },
  openGraph: {
    title: "World Cup 2026 Fan Gear Vancouver — In Stock",
    description:
      "In-stock World Cup 2026 fan gear shipped to Vancouver, BC in 3–5 business days. Caps, car flags, bucket hats, Panini sticker packs. CAD pricing, no duties.",
    url: absoluteUrl("/vancouver"),
    type: "website",
  },
};

const FAQS = [
  {
    q: "Where can I buy World Cup 2026 merchandise in Vancouver?",
    a: "World Fan Gear ships World Cup 2026 merchandise from our Toronto-area warehouse to Vancouver in 3–5 business days via Canada Post Expedited. Order by June 7 to receive before opening day.",
  },
  {
    q: "Is World Cup 2026 fan gear available in Vancouver right now?",
    a: "Yes — our full catalog is in stock and ready to ship to BC. Caps, bucket hats, car flags, Panini sticker packs, and mini boxing gloves for all major nations.",
  },
  {
    q: "Is BC Place hosting World Cup 2026 matches?",
    a: "Yes. BC Place in Vancouver is an official host venue for FIFA World Cup 2026. It is one of two Canadian host stadiums alongside BMO Field in Toronto.",
  },
  {
    q: "How long does shipping to Vancouver take?",
    a: "Orders from our North York warehouse typically arrive in 3–5 business days to Vancouver via Canada Post Expedited. All prices are in CAD with no hidden duties.",
  },
  {
    q: "What teams are popular in Vancouver for World Cup 2026?",
    a: "South Korea, Japan, Mexico, Canada, Brazil, and Portugal are among the most followed teams in Vancouver's diverse fan communities.",
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

const HOST_CITY_MATCHES = [
  { date: "June 2026", teams: "Group stage matches", venue: "BC Place, Vancouver" },
  { date: "June–July 2026", teams: "Multiple rounds", venue: "BC Place, Vancouver" },
  { date: "July 2026", teams: "Knockout stage", venue: "BC Place, Vancouver" },
];

const VANCOUVER_REASONS = [
  {
    icon: "🚀",
    title: "Ships to BC in 3–5 days",
    body: "We ship from North York, Toronto. Vancouver orders arrive via Canada Post Expedited in 3–5 business days. Order by June 7 for pre-tournament delivery.",
  },
  {
    icon: "✅",
    title: "In stock now",
    body: "Our full catalog is stocked and ready. Caps, bucket hats, car flags, Panini sticker packs, and mini boxing gloves for all 48 nations.",
  },
  {
    icon: "💰",
    title: "CAD pricing, no duties",
    body: "Everything is priced in Canadian dollars. No USD conversion, no import fees. What you see at checkout is what you pay.",
  },
  {
    icon: "🌍",
    title: "All 48 nations",
    body: "Vancouver's fan base is one of the most diverse in the country. We carry gear for South Korea, Japan, Mexico, Canada, Brazil, and every major nation.",
  },
];

export default async function VancouverPage() {
  const allProducts = await getAllProducts();
  const featured = allProducts.filter((p) => p.inStock).slice(0, 12);

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Vancouver", url: "/vancouver" },
  ]);

  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#local`,
    name: "World Fan Gear",
    description:
      "World Cup 2026 fan gear store shipping from Toronto to Vancouver and all of BC. Caps, bucket hats, car flags, Panini sticker packs.",
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
      { "@type": "City", name: "Vancouver" },
      { "@type": "State", name: "British Columbia" },
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
          Vancouver Host City · BC Place · June 2026
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
          World Cup 2026 Fan Gear<br className="hidden sm:block" /> in Vancouver
        </h1>
        <p className="text-base text-gray-500 leading-relaxed mb-6">
          Shop fan gear for all 48 nations — shipped from Toronto to Vancouver in 3–5 business days.
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
            href="/collections/world-cup-car-flags"
            className="rounded-full border border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 hover:border-gray-400 transition-colors"
          >
            Browse Car Flags
          </Link>
        </div>
      </div>

      {/* Why buy from us */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
        {VANCOUVER_REASONS.map((r) => (
          <div key={r.title} className="rounded-xl border border-gray-100 bg-gray-50 p-5">
            <div className="text-2xl mb-3">{r.icon}</div>
            <h2 className="text-sm font-bold text-gray-900 mb-1.5">{r.title}</h2>
            <p className="text-xs leading-5 text-gray-500">{r.body}</p>
          </div>
        ))}
      </div>

      {/* BC Place callout */}
      <div className="rounded-2xl bg-[#003876] text-white p-6 sm:p-8 mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-2">
          Vancouver is a Host City
        </p>
        <h2 className="text-xl font-black mb-4">Matches at BC Place</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {HOST_CITY_MATCHES.map((m) => (
            <div key={m.date} className="rounded-xl bg-white/10 p-4">
              <p className="text-xs font-bold text-blue-200 mb-1">{m.date}</p>
              <p className="text-sm font-semibold">{m.teams}</p>
              <p className="text-xs text-blue-200 mt-1">{m.venue}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-blue-200">
          Order by June 7 to guarantee delivery before the opening whistle.
        </p>
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

      {/* Vancouver context */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A] mb-2">
          One of the most diverse fan cities in North America
        </p>
        <h2 className="text-xl font-black text-gray-900 mb-4">
          Vancouver&rsquo;s World Cup is happening in the neighbourhood
        </h2>
        <div className="grid sm:grid-cols-2 gap-6 text-sm text-gray-600 leading-7">
          <div className="space-y-4">
            <p>
              When South Korea plays, Richmond fills up. When Mexico plays, the East Van community
              comes out. When Canada makes a run, the whole city shows up together. Vancouver&rsquo;s
              fan communities are spread across the metro — but they show up loudly.
            </p>
            <p>
              BC Place is a proper World Cup stadium. The atmosphere for big matches will push into
              the surrounding streets and neighbourhoods. Gear up before that happens.
            </p>
          </div>
          <div className="space-y-4">
            <p>
              We stock gear for all 48 nations — South Korea, Japan, Mexico, Canada, Brazil,
              Portugal, and every other team in the tournament. Something for every community in
              Vancouver.
            </p>
            <p>
              Ships from Toronto. Arrives in Vancouver in 3–5 business days. All priced in CAD.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/blog/world-cup-2026-fan-gear-vancouver" className="text-xs font-semibold text-[#C41E3A] hover:underline">
            → Vancouver fan gear guide
          </Link>
          <Link href="/blog/world-cup-watch-parties-vancouver" className="text-xs font-semibold text-[#C41E3A] hover:underline">
            → Where to watch in Vancouver
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-14">
        <h2 className="text-xl font-black text-gray-900 mb-6">
          Common questions about World Cup 2026 fan gear in Vancouver
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
