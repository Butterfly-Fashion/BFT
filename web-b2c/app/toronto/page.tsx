import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";
import { CityLandingPage, type CityPageConfig } from "@/components/store/city-landing-page";

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

const config: CityPageConfig = {
  slug: "toronto",
  cityName: "Toronto",
  heroBadge: "Toronto Host City · June 2026",
  heroTitle: (
    <>
      World Cup 2026 Merchandise
      <br className="hidden sm:block" /> In Stock in Toronto
    </>
  ),
  heroSubtitle:
    "Shop fan gear for all 48 nations — shipped from our Toronto warehouse in 1–2 business days. Caps, bucket hats, car flags, Panini sticker packs, and mini boxing gloves in stock now.",
  secondaryCta: { href: "/collections/world-cup-caps", label: "Browse Caps" },
  reasons: [
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
  ],
  hostCity: {
    badge: "Toronto is a Host City",
    venueName: "BMO Field",
    matches: [
      { date: "June 12", teams: "Group stage opens", venue: "BMO Field, Toronto" },
      { date: "June 13–July 2", teams: "Multiple group stage matches", venue: "BMO Field, Toronto" },
      { date: "July 6", teams: "Round of 16", venue: "BMO Field, Toronto" },
    ],
    note: "Get your gear sorted before June — demand spikes in the weeks before group stage.",
  },
  narrative: {
    eyebrow: "The most multicultural World Cup city on the planet",
    title: <>Toronto&rsquo;s World Cup is different</>,
    leftParagraphs: [
      <>
        When Portugal plays, Dundas West turns into a parade. When Italy plays, Corso Italia on St. Clair lights
        up. When Brazil plays, there&rsquo;s a neighbourhood for that too. Toronto doesn&rsquo;t watch the World
        Cup from the sidelines — it shows up for almost every match.
      </>,
      <>
        This city has one of the most diverse fan bases in the tournament. Canadian, Brazilian, Portuguese,
        Italian, Moroccan, Korean, Argentinian — walk 20 minutes in any direction and you&rsquo;re in a
        different World Cup neighbourhood.
      </>,
    ],
    rightParagraphs: [
      <>
        That&rsquo;s why we stock gear for all 48 nations. A Panini sticker box for the collector at your
        office. A car flag for match-day drive in. A bucket hat for the June fan zone. A mini boxing glove for
        your desk.
      </>,
      <>Everything ships from North York. In stock now. Ready before the first whistle on June 12.</>,
    ],
    links: [
      { href: "/blog/toronto-world-cup-2026-watch-party-venues", label: "Where to watch in Toronto" },
      { href: "/blog/where-to-buy-world-cup-2026-merchandise-toronto", label: "Buying guide for Toronto fans" },
    ],
  },
  faqHeading: "Common questions about World Cup 2026 merchandise in Toronto",
  faqs: [
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
  ],
  localBusiness: {
    description:
      "Toronto-area World Cup 2026 fan gear store. Caps, bucket hats, car flags, Panini sticker packs shipped from North York, ON.",
    areaServedState: "Ontario",
    telephone: "",
    geo: { latitude: 43.706, longitude: -79.453 },
    openingHoursSpecification: {
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    },
  },
};

export default function TorontoPage() {
  return <CityLandingPage config={config} />;
}
