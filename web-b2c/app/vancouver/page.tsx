import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";
import { CityLandingPage, type CityPageConfig } from "@/components/store/city-landing-page";

export const metadata: Metadata = {
  title: "World Cup 2026 Fan Gear Vancouver — In Stock, Ships to BC",
  description:
    "Shop World Cup 2026 fan gear in Vancouver. Caps, bucket hats, car flags, Panini sticker packs shipped from Toronto to BC on Canada Post's schedule, with UPS available for faster delivery. BC Place host city — gear up now.",
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
      "In-stock World Cup 2026 fan gear shipped from Toronto to Vancouver, BC, delivered on Canada Post's schedule (UPS available for faster delivery). Caps, car flags, bucket hats, Panini sticker packs. CAD pricing, no duties.",
    url: absoluteUrl("/vancouver"),
    type: "website",
  },
};

const config: CityPageConfig = {
  slug: "vancouver",
  cityName: "Vancouver",
  heroBadge: "Vancouver Host City · BC Place · June 2026",
  heroTitle: (
    <>
      World Cup 2026 Fan Gear
      <br className="hidden sm:block" /> in Vancouver
    </>
  ),
  heroSubtitle:
    "Shop fan gear for all 48 nations — shipped from our Toronto warehouse to Vancouver on Canada Post's schedule, with UPS available for faster delivery. Caps, bucket hats, car flags, Panini sticker packs in stock now.",
  secondaryCta: { href: "/collections/world-cup-car-flags", label: "Browse Car Flags" },
  reasons: [
    {
      icon: "🚀",
      title: "Ships to BC from Toronto",
      body: "We ship from North York, Toronto. Vancouver delivery timing is shown at checkout (Canada Post standard, or UPS for faster delivery), and local Toronto pickup is available for anyone in the GTA.",
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
  ],
  hostCity: {
    badge: "Vancouver is a Host City",
    venueName: "BC Place",
    matches: [
      { date: "June 2026", teams: "Group stage matches", venue: "BC Place, Vancouver" },
      { date: "June–July 2026", teams: "Multiple rounds", venue: "BC Place, Vancouver" },
      { date: "July 2026", teams: "Knockout stage", venue: "BC Place, Vancouver" },
    ],
    note: "Shipping is available from Toronto, with delivery timing shown at checkout.",
  },
  narrative: {
    eyebrow: "One of the most diverse fan cities in North America",
    title: <>Vancouver&rsquo;s World Cup is happening in the neighbourhood</>,
    leftParagraphs: [
      <>
        When South Korea plays, Richmond fills up. When Mexico plays, the East Van community comes out. When
        Canada makes a run, the whole city shows up together. Vancouver&rsquo;s fan communities are spread
        across the metro — but they show up loudly.
      </>,
      <>
        BC Place is a proper World Cup stadium. The atmosphere for big matches will push into the surrounding
        streets and neighbourhoods. Gear up before that happens.
      </>,
    ],
    rightParagraphs: [
      <>
        We stock gear for all 48 nations — South Korea, Japan, Mexico, Canada, Brazil, Portugal, and every
        other team in the tournament. Something for every community in Vancouver.
      </>,
      <>Ships from Toronto on Canada Post&apos;s schedule, with UPS available at checkout for faster delivery. All priced in CAD.</>,
    ],
    links: [
      { href: "/blog/world-cup-2026-fan-gear-vancouver", label: "Vancouver fan gear guide" },
      { href: "/blog/world-cup-watch-parties-vancouver", label: "Where to watch in Vancouver" },
    ],
  },
  faqHeading: "Common questions about World Cup 2026 fan gear in Vancouver",
  faqs: [
    {
      q: "Where can I buy World Cup 2026 merchandise in Vancouver?",
      a: "World Fan Gear ships World Cup 2026 merchandise from our Toronto-area warehouse to Vancouver, with delivery timing shown at checkout.",
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
      a: "Orders ship from our North York warehouse to Vancouver via Canada Post, with delivery on Canada Post's standard schedule. Choose UPS at checkout if you need it faster. All prices are in CAD with no hidden duties.",
    },
    {
      q: "What teams are popular in Vancouver for World Cup 2026?",
      a: "South Korea, Japan, Mexico, Canada, Brazil, and Portugal are among the most followed teams in Vancouver's diverse fan communities.",
    },
  ],
  localBusiness: {
    description:
      "World Cup 2026 fan gear store shipping from Toronto to Vancouver and all of BC. Caps, bucket hats, car flags, Panini sticker packs.",
    areaServedState: "British Columbia",
  },
};

export default function VancouverPage() {
  return <CityLandingPage config={config} />;
}
