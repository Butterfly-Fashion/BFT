import type { Metadata } from "next";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { ProductCard } from "@/components/store/product-card";
import { absoluteUrl, breadcrumbJsonLd, jsonLd, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "World Cup 2026 Toronto Merchandise — In Stock, Ships from Toronto",
  description:
    "Shop World Cup 2026 merchandise in Toronto. Caps, bucket hats, car flags, Panini sticker packs, and mini boxing gloves — in stock and shipped from our Toronto warehouse. Canada's cheapest World Cup fan gear.",
  keywords: [
    "World Cup 2026 Toronto merchandise",
    "buy World Cup 2026 gear Toronto",
    "FIFA 2026 Toronto fan gear in stock",
    "World Cup 2026 Toronto souvenirs",
    "World Cup 2026 merchandise Toronto in stock",
    "FIFA 2026 Toronto gifts",
    "World Cup Toronto caps",
    "World Cup Toronto car flags",
    "Panini stickers Toronto",
    "Toronto World Cup 2026 shop",
  ],
  alternates: {
    canonical: "/toronto",
  },
  openGraph: {
    title: "World Cup 2026 Toronto Merchandise — In Stock",
    description:
      "In-stock World Cup 2026 fan gear shipped from Toronto. Caps, car flags, bucket hats, Panini sticker packs. No duties, transparent CAD pricing.",
    url: absoluteUrl("/toronto"),
    type: "website",
  },
};

const FAQS = [
  {
    q: "Where can I buy World Cup 2026 merchandise in Toronto?",
    a: "World Fan Gear ships World Cup 2026 merchandise from our Toronto-area warehouse. Order online and receive your gear in 1–3 business days across the GTA, or 3–7 days anywhere in Canada.",
  },
  {
    q: "Is World Cup 2026 merchandise available in Toronto right now?",
    a: "Yes — our full catalog is in stock and ready to ship from Toronto. Caps, bucket hats, car flags, Panini sticker packs, and mini boxing gloves for all major nations.",
  },
  {
    q: "Do you ship World Cup 2026 gear same day from Toronto?",
    a: "Orders placed before 2 PM ET on business days are packed and dispatched same day. GTA customers typically receive within 1–2 business days.",
  },
  {
    q: "What World Cup 2026 teams can I buy merchandise for in Toronto?",
    a: "We carry gear for Canada, USA, Mexico, Brazil, Argentina, France, Germany, England, Portugal, Spain, Italy, Japan, South Korea, Morocco, Nigeria, Senegal, and more — all in stock.",
  },
  {
    q: "Is the FIFA official store sold out in Toronto?",
    a: "The FIFA official store's Toronto host-city collection sold out quickly. Our store carries in-stock alternatives — caps, car flags, and fan gear — shipping from Toronto with transparent CAD pricing and no surprise duties.",
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
  { date: "June 12", teams: "Group stage opens", venue: "BMO Field, Toronto" },
  { date: "June 13–July 2", teams: "Multiple group stage matches", venue: "BMO Field, Toronto" },
  { date: "July 6", teams: "Round of 16", venue: "BMO Field, Toronto" },
];

const TORONTO_REASONS = [
  {
    icon: "📦",
    title: "Ships from Toronto",
    body: "Our warehouse is in North York. GTA orders arrive in 1–2 business days. No international shipping, no duty surprises.",
  },
  {
    icon: "✅",
    title: "In stock now",
    body: "The FIFA official Toronto collection sold out weeks ago. We keep our full catalog stocked through July 2026.",
  },
  {
    icon: "💰",
    title: "Transparent CAD pricing",
    body: "Everything is priced in Canadian dollars. No USD conversion, no hidden import fees at checkout.",
  },
  {
    icon: "🌍",
    title: "All 48 nations",
    body: "Toronto is one of the most multicultural cities in the world. We carry gear for every major team in the tournament.",
  },
];

export default async function TorontoPage() {
  const allProducts = await getAllProducts();
  const featured = allProducts.filter((p) => p.inStock).slice(0, 12);

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Toronto", url: "/toronto" },
  ]);

  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#local`,
    name: "World Fan Gear",
    description:
      "Toronto-area World Cup 2026 fan gear store. Caps, bucket hats, car flags, Panini sticker packs shipped from North York, ON.",
    url: SITE_URL,
    telephone: "",
    address: {
      "@type": "PostalAddress",
      streetAddress: "178 Bentworth Ave",
      addressLocality: "North York",
      addressRegion: "ON",
      postalCode: "M6A 1P7",
      addressCountry: "CA",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 43.706,
      longitude: -79.453,
    },
    areaServed: [
      { "@type": "City", name: "Toronto" },
      { "@type": "State", name: "Ontario" },
      { "@type": "Country", name: "Canada" },
    ],
    priceRange: "$10 – $35 CAD",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(localBusinessLd) }} />

      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A] mb-3">
          Toronto Host City · June 2026
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
          World Cup 2026 Merchandise<br className="hidden sm:block" /> In Stock in Toronto
        </h1>
        <p className="text-base text-gray-500 leading-relaxed mb-6">
          Shop fan gear for all 48 nations — shipped from our Toronto warehouse in 1–2 business days.
          Caps, bucket hats, car flags, Panini sticker packs, and mini boxing gloves in stock now.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/products"
            className="rounded-full bg-[#C41E3A] px-6 py-3 text-sm font-bold text-white hover:bg-[#A01830] transition-colors"
          >
            Shop All In-Stock Gear →
          </Link>
          <Link
            href="/collections/world-cup-caps"
            className="rounded-full border border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 hover:border-gray-400 transition-colors"
          >
            Browse Caps
          </Link>
        </div>
      </div>

      {/* Why buy from us */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
        {TORONTO_REASONS.map((r) => (
          <div key={r.title} className="rounded-xl border border-gray-100 bg-gray-50 p-5">
            <div className="text-2xl mb-3">{r.icon}</div>
            <h2 className="text-sm font-bold text-gray-900 mb-1.5">{r.title}</h2>
            <p className="text-xs leading-5 text-gray-500">{r.body}</p>
          </div>
        ))}
      </div>

      {/* Toronto match schedule callout */}
      <div className="rounded-2xl bg-[#003876] text-white p-6 sm:p-8 mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-2">
          Toronto is a Host City
        </p>
        <h2 className="text-xl font-black mb-4">Matches at BMO Field</h2>
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
          Get your gear sorted before June — demand spikes in the weeks before group stage.
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

      {/* Toronto context section */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A] mb-2">
          The most multicultural World Cup city on the planet
        </p>
        <h2 className="text-xl font-black text-gray-900 mb-4">
          Toronto&rsquo;s World Cup is different
        </h2>
        <div className="grid sm:grid-cols-2 gap-6 text-sm text-gray-600 leading-7">
          <div className="space-y-4">
            <p>
              When Portugal plays, Dundas West turns into a parade. When Italy plays, Corso Italia on St. Clair
              lights up. When Brazil plays, there&rsquo;s a neighbourhood for that too. Toronto doesn&rsquo;t watch the
              World Cup from the sidelines — it shows up for almost every match.
            </p>
            <p>
              This city has one of the most diverse fan bases in the tournament. Canadian, Brazilian, Portuguese,
              Italian, Moroccan, Korean, Argentinian — walk 20 minutes in any direction and you&rsquo;re in a
              different World Cup neighbourhood.
            </p>
          </div>
          <div className="space-y-4">
            <p>
              That&rsquo;s why we stock gear for all 48 nations. A Panini sticker box for the collector at your
              office. A car flag for match-day drive in. A bucket hat for the June fan zone. A mini boxing glove
              for your desk.
            </p>
            <p>
              Everything ships from North York. In stock now. Ready before the first whistle on June 12.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/blog/world-cup-watch-parties-toronto" className="text-xs font-semibold text-[#C41E3A] hover:underline">
            → Where to watch in Toronto
          </Link>
          <Link href="/blog/where-to-buy-world-cup-2026-merchandise-toronto" className="text-xs font-semibold text-[#C41E3A] hover:underline">
            → Buying guide for Toronto fans
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-14">
        <h2 className="text-xl font-black text-gray-900 mb-6">
          Common questions about World Cup 2026 merchandise in Toronto
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
