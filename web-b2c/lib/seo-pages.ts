import { products } from "@/lib/products";
import type { Product } from "@/lib/types";

export interface CollectionPage {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  category?: string;
  match?: (product: Product) => boolean;
}

export interface TeamPage {
  slug: string;
  team: string;
  title: string;
  description: string;
  intro: string;
  terms: string[];
}

export interface SeoLandingSection {
  heading: string;
  body: string;
}

export interface SeoLandingFaq {
  q: string;
  a: string;
}

export const collectionPages: CollectionPage[] = [
  {
    slug: "world-cup-caps",
    title: "World Cup 2026 Caps in Canada",
    description:
      "Shop Canada 2026-inspired soccer fan caps shipping across Canada from Toronto.",
    h1: "World Cup 2026 Caps",
    intro:
      "Find embroidered soccer fan caps made for match days, watch parties, and everyday team pride. These Canada 2026-inspired caps are easy gifts for fans gearing up before the tournament.",
    category: "Caps",
  },
  {
    slug: "world-cup-bucket-hats",
    title: "World Cup 2026 Bucket Hats",
    description:
      "Shop soccer fan bucket hats for Canada 2026 match days, outdoor watch parties, and summer fan events.",
    h1: "World Cup 2026 Bucket Hats",
    intro:
      "Bucket hats are a natural fit for sunny match days, fan zones, and outdoor screenings. Browse bold country styles for Canada 2026-inspired outfits.",
    category: "Bucket Hats",
  },
  {
    slug: "world-cup-car-flags",
    title: "World Cup 2026 Car Flags",
    description:
      "Shop soccer fan car flags for Canada 2026 parades, tailgates, and match-day drives.",
    h1: "World Cup 2026 Car Flags",
    intro:
      "Car flags are built for the loudest part of tournament season: the drive, the parade, and the celebration after the final whistle. Fly your colours across Canada.",
    category: "Car Flags",
  },
  {
    slug: "souvenir-boxing-gloves",
    title: "Mini Boxing Gloves Souvenirs",
    description:
      "Shop mini boxing glove souvenirs for soccer fans, collectors, and Canada 2026 gift ideas.",
    h1: "Mini Boxing Gloves Souvenirs",
    intro:
      "Mini boxing gloves are lightweight souvenirs for hanging, gifting, and collecting. Pick a country colourway and keep the match-day energy close.",
    category: "Boxing Gloves",
  },
  {
    slug: "canada-2026-fan-gear",
    title: "Canada 2026 Fan Gear",
    description:
      "Shop Canada 2026-inspired fan gear including caps, bucket hats, car flags, and souvenirs.",
    h1: "Canada 2026 Fan Gear",
    intro:
      "Get ready for the tournament with fan gear that ships from Canada. Browse caps, bucket hats, car flags, and souvenirs for watch parties, road trips, and match days.",
    match: (product) => product.name.toLowerCase().includes("canada"),
  },
  {
    slug: "world-cup-gifts",
    title: "Best World Cup 2026 Gifts Canada — Fan Gear Gift Ideas",
    description:
      "Shop the best World Cup 2026 gifts for Canadian soccer fans. Caps, bucket hats, car flags, Panini sticker packs, and mini boxing gloves — all under $35 CAD, shipped from Toronto.",
    h1: "World Cup 2026 Gifts",
    intro:
      "The best World Cup 2026 gifts for soccer fans don't need to be expensive. Caps, car flags, Panini sticker packs, and mini boxing gloves are all under $35 CAD, easy to gift, and ready to ship from Toronto across Canada.",
    match: () => true,
  },
  {
    slug: "panini-stickers",
    title: "Panini FIFA World Cup 2026 Stickers Canada — In Stock",
    description:
      "Buy Panini FIFA World Cup 2026 sticker packs, 50-pack boxes, and bundles in Canada. In stock and shipped from Toronto. Official Panini stickers for all 48 nations.",
    h1: "Panini FIFA World Cup 2026 Stickers",
    intro:
      "Official Panini FIFA World Cup 2026 sticker packs and boxes — in stock and shipping from Toronto. Build your album, open packs with friends, and collect all 48 nations before the tournament ends.",
    category: "Sticker Packs",
  },
  {
    slug: "canada-fan-gear",
    title: "Canada Fan Gear for World Cup 2026 — Caps, Flags & Bucket Hats",
    description:
      "Shop Canada fan gear for World Cup 2026. Embroidered caps, reversible bucket hats, car flags, and souvenirs for Canada supporters — ships from Toronto, in stock now.",
    h1: "Canada Fan Gear",
    intro:
      "Canada is a host nation for World Cup 2026. Show your support with fan gear made for Toronto match days, car parades, watch parties, and outdoor fan zones. Ships same day from our North York warehouse.",
    match: (product) => product.name.toLowerCase().includes("canada"),
  },
  {
    slug: "world-cup-merchandise-canada",
    title: "World Cup 2026 Merchandise Canada — In Stock, Ships from Toronto",
    description:
      "Shop World Cup 2026 merchandise in Canada. Caps, bucket hats, car flags, Panini sticker packs, and mini boxing gloves — all in stock and shipped from Toronto.",
    h1: "World Cup 2026 Merchandise",
    intro:
      "Browse the full range of World Cup 2026 merchandise available in Canada. All items are in stock and ship from our Toronto warehouse — perfect for fans, collectors, and gift-givers across Canada.",
    match: () => true,
  },
];

export const teamPages: TeamPage[] = [
  {
    slug: "canada",
    team: "Canada",
    title: "Canada World Cup 2026 Fan Gear",
    description:
      "Shop Canada fan gear for World Cup 2026, including car flags, caps, bucket hats, and souvenirs shipping across Canada.",
    intro:
      "Show Canada pride before the tournament kicks off. Browse Canada fan gear for match days, car parades, watch parties, and everyday soccer pride.",
    terms: ["canada"],
  },
  {
    slug: "argentina",
    team: "Argentina",
    title: "Argentina World Cup 2026 Fan Gear",
    description:
      "Shop Argentina fan gear for Canada 2026, including caps, bucket hats, car flags, and soccer souvenirs.",
    intro:
      "Bring Argentina colours to match day with fan gear made for watch parties, road trips, and tournament celebrations.",
    terms: ["argentina"],
  },
  {
    slug: "brazil",
    team: "Brazil",
    title: "Brazil World Cup 2026 Fan Gear",
    description:
      "Shop Brazil soccer fan gear for Canada 2026, including flags, caps, bucket hats, and souvenirs.",
    intro:
      "Brazil fan gear brings bright colour and instant match-day energy. Find pieces for your car, your outfit, and your watch party setup.",
    terms: ["brazil", "brasil"],
  },
  {
    slug: "france",
    team: "France",
    title: "France World Cup 2026 Fan Gear",
    description:
      "Shop France soccer fan gear for Canada 2026 match days, watch parties, and gifts.",
    intro:
      "Support France with Canada 2026-inspired fan gear for the stands, the living room, and the drive to the party.",
    terms: ["france"],
  },
  {
    slug: "germany",
    team: "Germany",
    title: "Germany World Cup 2026 Fan Gear",
    description:
      "Shop Germany soccer fan gear for Canada 2026, including car flags, caps, and souvenirs.",
    intro:
      "Get Germany colours ready for tournament season with car flags, caps, and souvenir pieces that ship across Canada.",
    terms: ["germany", "deutschland"],
  },
  {
    slug: "mexico",
    team: "Mexico",
    title: "Mexico World Cup 2026 Fan Gear",
    description:
      "Shop Mexico fan gear for World Cup 2026, including soccer caps, car flags, bucket hats, and souvenirs.",
    intro:
      "Mexico fans bring the noise. Browse Canada 2026-inspired gear for match-day outfits, car parades, and watch parties.",
    terms: ["mexico"],
  },
  {
    slug: "portugal",
    team: "Portugal",
    title: "Portugal World Cup 2026 Fan Gear",
    description:
      "Shop Portugal soccer fan gear for Canada 2026, from caps and car flags to souvenirs.",
    intro:
      "Gear up in Portugal colours before the tournament rush. Find fan pieces for gifts, match days, and celebrations.",
    terms: ["portugal"],
  },
  {
    slug: "spain",
    team: "Spain",
    title: "Spain World Cup 2026 Fan Gear",
    description:
      "Shop Spain soccer fan gear for Canada 2026, including caps, car flags, bucket hats, and souvenirs.",
    intro:
      "Browse Spain fan gear made for tournament season, from car flags to match-day accessories.",
    terms: ["spain"],
  },
  {
    slug: "usa",
    team: "USA",
    title: "USA World Cup 2026 Fan Gear",
    description:
      "Shop USA soccer fan gear for World Cup 2026, including car flags, caps, and souvenirs shipping in Canada.",
    intro:
      "Support the USA with fan gear for Canada 2026 road trips, watch parties, and match-day celebrations.",
    terms: ["usa", "u-s-a", "united states"],
  },
  {
    slug: "england",
    team: "England",
    title: "England World Cup 2026 Fan Gear",
    description:
      "Shop England soccer fan gear for World Cup 2026, including caps, car flags, and souvenirs shipping across Canada.",
    intro:
      "Back England through every match day with fan gear made for watch parties, car parades, and tournament celebrations in Canada.",
    terms: ["england"],
  },
  {
    slug: "italy",
    team: "Italy",
    title: "Italy World Cup 2026 Fan Gear",
    description:
      "Shop Italy soccer fan gear for World Cup 2026, including caps, bucket hats, car flags, and souvenirs for Canadian fans.",
    intro:
      "Bring the azzurri energy to every match day. Italy fan gear ships from Toronto to Little Italy communities and soccer fans across Canada.",
    terms: ["italy", "italia"],
  },
  {
    slug: "morocco",
    team: "Morocco",
    title: "Morocco World Cup 2026 Fan Gear",
    description:
      "Shop Morocco soccer fan gear for World Cup 2026, including car flags, caps, and souvenirs shipping across Canada.",
    intro:
      "Morocco has one of the most passionate fan bases in Canada. Browse fan gear for match days, watch parties, and car parades.",
    terms: ["morocco"],
  },
  {
    slug: "japan",
    team: "Japan",
    title: "Japan World Cup 2026 Fan Gear",
    description:
      "Shop Japan soccer fan gear for World Cup 2026, including embroidered caps, car flags, and souvenirs for Canadian fans.",
    intro:
      "Support Japan's World Cup campaign with fan gear for watch parties, outdoor screenings, and match-day outfits across Canada.",
    terms: ["japan"],
  },
  {
    slug: "south-korea",
    team: "South Korea",
    title: "South Korea World Cup 2026 Fan Gear",
    description:
      "Shop South Korea soccer fan gear for World Cup 2026, including caps, car flags, and souvenirs shipping across Canada.",
    intro:
      "South Korea fans bring serious tournament energy. Find fan gear for Vancouver, Toronto, and Canadian cities with strong Korean-Canadian communities.",
    terms: ["south korea", "korea"],
  },
  {
    slug: "nigeria",
    team: "Nigeria",
    title: "Nigeria World Cup 2026 Fan Gear",
    description:
      "Shop Nigeria soccer fan gear for World Cup 2026, including caps, car flags, and souvenirs shipping across Canada.",
    intro:
      "Nigeria brings one of the most electric atmospheres to any World Cup. Find fan gear for Toronto, Calgary, and Canadian cities with strong Nigerian-Canadian communities.",
    terms: ["nigeria"],
  },
  {
    slug: "senegal",
    team: "Senegal",
    title: "Senegal World Cup 2026 Fan Gear",
    description:
      "Shop Senegal soccer fan gear for World Cup 2026, including caps, car flags, and souvenirs shipping across Canada.",
    intro:
      "Senegal fans are passionate and vocal. Browse fan gear for match days, watch parties, and car parades across Canada.",
    terms: ["senegal"],
  },
  {
    slug: "netherlands",
    team: "Netherlands",
    title: "Netherlands World Cup 2026 Fan Gear",
    description:
      "Shop Netherlands soccer fan gear for World Cup 2026, including orange caps, car flags, and souvenirs shipping across Canada.",
    intro:
      "The Netherlands brings iconic orange colours to every World Cup. Find Dutch fan gear for match days, watch parties, and tournament celebrations across Canada.",
    terms: ["netherlands", "holland", "dutch"],
  },
];

export function getCollectionPage(slug: string): CollectionPage | undefined {
  return collectionPages.find((page) => page.slug === slug);
}

export function getTeamPage(slug: string): TeamPage | undefined {
  return teamPages.find((page) => page.slug === slug);
}

export function getProductsForCollection(page: CollectionPage): Product[] {
  if (page.match) return products.filter(page.match);
  return products.filter((product) => product.category === page.category);
}

export function getProductsForTeam(page: TeamPage): Product[] {
  return products.filter((product) => {
    const name = product.name.toLowerCase();
    return page.terms.some((term) => name.includes(term));
  });
}

export function getCollectionSeoSections(page: CollectionPage): SeoLandingSection[] {
  return [
    {
      heading: `Best ${page.h1.toLowerCase()} for Canada 2026`,
      body: `${page.h1} are useful for watch parties, outdoor screenings, car parades, and everyday tournament outfits. For Canadian shoppers, the best pieces are easy to wear, easy to gift, and simple to reuse across multiple match days.`,
    },
    {
      heading: "When to buy before the tournament",
      body: "Popular country colours tend to move faster once match schedules, watch parties, and knockout-stage storylines become part of the conversation. Buying early gives you more selection and a better shipping window before demand increases.",
    },
    {
      heading: "Shipping across Canada",
      body: "World Fan Gear ships from the Toronto area to customers across Canada. That makes these products practical for fans preparing in Toronto, Vancouver, Montreal, Calgary, Ottawa, Edmonton, and smaller soccer communities.",
    },
  ];
}

export function getCollectionFaqs(page: CollectionPage): SeoLandingFaq[] {
  return [
    {
      q: `Are ${page.h1.toLowerCase()} good for World Cup 2026 watch parties?`,
      a: `Yes. ${page.h1} work well for match days because they are visible, reusable, and easy to pair with other fan gear.`,
    },
    {
      q: `Do ${page.h1.toLowerCase()} ship within Canada?`,
      a: "Yes. World Fan Gear ships orders from the Toronto area to Canadian addresses.",
    },
  ];
}

export function getTeamSeoSections(page: TeamPage): SeoLandingSection[] {
  return [
    {
      heading: `Best gear for ${page.team} fans`,
      body: `${page.team} supporters can build a simple World Cup 2026 setup with one wearable piece and one visibility piece. A cap or bucket hat handles the outfit, while a car flag or small souvenir brings the colour to the drive, patio, or watch party table.`,
    },
    {
      heading: "Match-day use",
      body: "Choose pieces that work beyond one game. Reusable fan gear is better for the group stage, knockout rounds, backyard screenings, and city watch parties because it can move with you from home to patio to fan zone.",
    },
    {
      heading: "Buying early in Canada",
      body: `${page.team} gear can sell through quickly when the team gets momentum. Ordering before the busiest match weeks gives Canadian fans more choice and a more comfortable delivery window.`,
    },
  ];
}

export function getTeamFaqs(page: TeamPage): SeoLandingFaq[] {
  return [
    {
      q: `What should ${page.team} fans buy for World Cup 2026?`,
      a: "Caps, bucket hats, car flags, and small souvenirs are the easiest fan gear choices because they are reusable and simple to gift.",
    },
    {
      q: `Can I order ${page.team} fan gear in Canada?`,
      a: "Yes. World Fan Gear ships soccer fan gear across Canada from the Toronto area.",
    },
  ];
}

export function faqPageJsonLd(faqs: SeoLandingFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}
