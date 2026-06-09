import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";
import { CityLandingPage, type CityPageConfig } from "@/components/store/city-landing-page";

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

const config: CityPageConfig = {
  slug: "montreal",
  cityName: "Montreal",
  heroBadge: "Montreal · Ships to Quebec · June 2026",
  heroTitle: (
    <>
      World Cup 2026 Fan Gear
      <br className="hidden sm:block" /> in Montreal
    </>
  ),
  heroSubtitle:
    "Shop fan gear for all 48 nations — shipped from our Toronto warehouse to Montreal in 2–3 business days. Caps, bucket hats, car flags, Panini sticker packs in stock now.",
  secondaryCta: { href: "/collections/panini-stickers", label: "Shop Panini Stickers" },
  reasons: [
    {
      icon: "🚀",
      title: "Ships in 2–3 days",
      body: "Toronto to Montreal is our fastest route outside Ontario. Shipping timing is shown at checkout, and Toronto-area local pickup is available.",
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
  ],
  narrative: {
    eyebrow: "One of the most passionate soccer cities in Canada",
    title: <>Montréal&rsquo;s World Cup is in the streets</>,
    leftParagraphs: [
      <>
        When Morocco plays, the energy on Saint-Laurent is unlike anywhere else in Canada. When Argentina
        plays, you can feel it in Little Italy. When Algeria or Haiti make a run, the whole city wakes up.
        Montreal doesn&rsquo;t just watch the World Cup — it lives it.
      </>,
      <>
        The fan communities here are some of the most passionate on the continent. This is a city that has
        been waiting for the World Cup to come to North America for a long time.
      </>,
    ],
    rightParagraphs: [
      <>
        We carry gear for all 48 nations — Morocco, Algeria, Argentina, Italy, Brazil, Haiti, Canada, and
        every other team in the tournament. Gear that works for a Plateau terrace or a Saint-Denis watch
        party.
      </>,
      <>Ships from Toronto. Arrives in Montreal in 2–3 business days. All prices in CAD.</>,
    ],
    links: [
      { href: "/blog/world-cup-2026-fan-gear-montreal", label: "Montreal fan gear guide" },
      { href: "/blog/world-cup-watch-parties-montreal", label: "Where to watch in Montreal" },
    ],
  },
  faqHeading: "Common questions about World Cup 2026 fan gear in Montreal",
  faqs: [
    {
      q: "Where can I buy World Cup 2026 merchandise in Montreal?",
      a: "World Fan Gear ships World Cup 2026 merchandise from our Toronto-area warehouse to Montreal, with delivery timing shown at checkout.",
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
  ],
  localBusiness: {
    description:
      "World Cup 2026 fan gear store shipping from Toronto to Montreal and all of Quebec. Caps, bucket hats, car flags, Panini sticker packs.",
    areaServedState: "Quebec",
  },
};

export default function MontrealPage() {
  return <CityLandingPage config={config} />;
}
