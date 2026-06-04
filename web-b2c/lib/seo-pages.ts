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
  /** When set, this page defers to another canonical URL (excluded from sitemap). */
  canonicalUrl?: string;
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
    title: "Canada World Cup 2026 Caps & Hats — Embroidered, Ships from Toronto",
    description:
      "Shop FIFA World Cup 2026 embroidered caps and hats for every nation — Canada, Brazil, Senegal, Poland and more. In stock, ships across Canada from Toronto.",
    h1: "World Cup 2026 Caps & Hats",
    intro:
      "Embroidered fan caps and hats for every nation at FIFA 2026. Canada, Brazil, Senegal, Poland, and more — in stock now, ships from Toronto. Easy gifts with no sizing required.",
    category: "Caps",
  },
  {
    slug: "world-cup-bucket-hats",
    title: "Canada World Cup 2026 Bucket Hats — Team Colours, Ships from Toronto",
    description:
      "Shop FIFA World Cup 2026 bucket hats for Canada, Brazil, and more. Sun protection for fan zones and outdoor match days. In stock, ships across Canada from Toronto.",
    h1: "World Cup 2026 Bucket Hats",
    intro:
      "Bucket hats for every outdoor match day and fan zone. Bold country colours, sun protection for Canadian summer. In stock, ships from Toronto.",
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
    canonicalUrl: "/collections/canada-2026-fan-gear",
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
    canonicalUrl: "/collections/world-cup-gifts",
  },
  {
    slug: "best-fifa-2026-merch-canada",
    title: "Best FIFA 2026 Merch in Canada - Fan Gear Ships from Toronto",
    description:
      "Shop the best FIFA 2026 merch in Canada, including World Cup caps, bucket hats, car flags, stickers, and soccer souvenirs shipped from Toronto.",
    h1: "Best FIFA 2026 Merch in Canada",
    intro:
      "Looking for FIFA 2026 merch in Canada? Start with practical match-day gear: caps for everyday wear, bucket hats for outdoor fan zones, car flags for the drive, stickers for collectors, and small souvenirs for gifts.",
    match: () => true,
    canonicalUrl: "/collections/world-cup-gifts",
  },
  {
    slug: "world-cup-bucket-hats-toronto",
    title: "World Cup Bucket Hats Toronto - Canada 2026 Fan Gear",
    description:
      "Shop World Cup bucket hats in Toronto for Canada 2026 match days, outdoor screenings, patios, and fan zones. Ships from North York across Canada.",
    h1: "World Cup Bucket Hats Toronto",
    intro:
      "Toronto World Cup watch parties and outdoor fan zones call for gear that handles sun, crowds, and photos. Bucket hats are the practical match-day piece for summer screenings, patios, and stadium walks.",
    category: "Bucket Hats",
    canonicalUrl: "/collections/world-cup-bucket-hats",
  },
  {
    slug: "canada-soccer-fan-gear",
    title: "Canada Soccer Fan Gear - World Cup 2026 Canada Supporters",
    description:
      "Shop Canada soccer fan gear for World Cup 2026, including caps, bucket hats, car flags, and souvenirs shipping from Toronto.",
    h1: "Canada Soccer Fan Gear",
    intro:
      "Canada supporters need gear that works at home, on the road, and in the fan zone. Browse Canada soccer fan gear for World Cup 2026 watch parties, car parades, and gifts.",
    match: (product) => product.name.toLowerCase().includes("canada"),
    canonicalUrl: "/collections/canada-2026-fan-gear",
  },
  {
    slug: "world-cup-party-supplies-canada",
    title: "World Cup Party Supplies Canada - Watch Party Fan Gear",
    description:
      "Shop World Cup party supplies in Canada for 2026 watch parties, including car flags, caps, bucket hats, stickers, and soccer souvenirs.",
    h1: "World Cup Party Supplies Canada",
    intro:
      "Set up a World Cup 2026 watch party with fan gear that doubles as decor and take-home souvenirs. Car flags, stickers, bucket hats, caps, and mini souvenirs make the room feel like match day fast.",
    match: () => true,
    canonicalUrl: "/collections/world-cup-gifts",
  },
  {
    slug: "world-cup-fan-gear-toronto",
    title: "World Cup Fan Gear Toronto - Canada 2026 Merchandise",
    description:
      "Shop World Cup fan gear in Toronto for Canada 2026. Caps, bucket hats, car flags, sticker packs, and soccer souvenirs ship from North York.",
    h1: "World Cup Fan Gear Toronto",
    intro:
      "Toronto is one of Canada's biggest World Cup cities. Get fan gear ready before match weeks: wearable pieces for patios and fan zones, car flags for the drive, and small souvenirs for watch party tables.",
    match: () => true,
    canonicalUrl: "/toronto",
  },
];

export const teamPages: TeamPage[] = [
  {
    slug: "canada",
    team: "Canada",
    title: "Team Canada FIFA World Cup 2026 Hats, Caps & Car Flags — In Stock",
    description:
      "Team Canada FIFA World Cup 2026 fan gear — embroidered caps, bucket hats, car flags, and souvenirs. In stock, ships from Toronto across Canada.",
    intro:
      "Team Canada fan gear for match days, watch parties, and car parades. Embroidered caps, bucket hats, car flags, and souvenirs — all in stock and shipping from Toronto.",
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
    title: "Brazil FIFA World Cup 2026 Hats, Car Flags & Fan Gear — Canada",
    description:
      "Shop Brazil FIFA World Cup 2026 fan gear — caps, bucket hats, car flags, and mini boxing gloves. In stock, ships from Toronto across Canada.",
    intro:
      "Brazil fan gear in bold yellow and green — caps, bucket hats, car flags, and mini boxing gloves. In stock now, ships from Toronto.",
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
  {
    slug: "colombia",
    team: "Colombia",
    title: "Colombia World Cup 2026 Fan Gear",
    description:
      "Shop Colombia soccer fan gear for World Cup 2026, including caps, car flags, and souvenirs shipping across Canada. Great for Toronto's large Colombian community.",
    intro:
      "Colombia brings electric energy to every World Cup. Toronto has one of Canada's largest Colombian communities — find fan gear for match days, car parades, and watch parties.",
    terms: ["colombia"],
  },
  {
    slug: "jamaica",
    team: "Jamaica",
    title: "Jamaica World Cup 2026 Fan Gear",
    description:
      "Shop Jamaica soccer fan gear for World Cup 2026, including caps, car flags, and souvenirs shipping across Canada.",
    intro:
      "Jamaica's return to the World Cup is a massive moment for fans across Toronto and Canada. Find fan gear built for match-day celebrations, car parades, and community watch parties.",
    terms: ["jamaica"],
  },
  {
    slug: "croatia",
    team: "Croatia",
    title: "Croatia World Cup 2026 Fan Gear",
    description:
      "Shop Croatia soccer fan gear for World Cup 2026, including caps, car flags, and souvenirs shipping across Canada.",
    intro:
      "Croatia punches above its weight every tournament. Toronto has a strong Croatian-Canadian community — find fan gear for match days, watch parties, and car parades.",
    terms: ["croatia"],
  },
  {
    slug: "poland",
    team: "Poland",
    title: "Poland World Cup 2026 Fan Gear",
    description:
      "Shop Poland soccer fan gear for World Cup 2026, including caps, car flags, and souvenirs shipping across Canada.",
    intro:
      "Poland fans in Toronto and across Canada come out loud for every tournament. Find fan gear for match days, watch parties, and community celebrations.",
    terms: ["poland"],
  },
  {
    slug: "australia",
    team: "Australia",
    title: "Australia World Cup 2026 Fan Gear",
    description:
      "Shop Australia soccer fan gear for World Cup 2026, including caps, car flags, and souvenirs shipping across Canada.",
    intro:
      "The Socceroos have a passionate fanbase across Canada. Find Australia fan gear for match days, watch parties, and tournament celebrations.",
    terms: ["australia", "socceroos"],
  },
  {
    slug: "belgium",
    team: "Belgium",
    title: "Belgium World Cup 2026 Fan Gear",
    description:
      "Shop Belgium soccer fan gear for World Cup 2026, including caps, car flags, and souvenirs shipping across Canada.",
    intro:
      "Belgium's Golden Generation still has plenty left. Find fan gear for Canadian match days, watch parties, and car parades in Belgium colours.",
    terms: ["belgium"],
  },
  {
    slug: "ecuador",
    team: "Ecuador",
    title: "Ecuador World Cup 2026 Fan Gear",
    description:
      "Shop Ecuador soccer fan gear for World Cup 2026, including caps, car flags, and souvenirs shipping across Canada.",
    intro:
      "Ecuador's growing fanbase is well-represented across Canada. Find fan gear for match days, community watch parties, and car parades.",
    terms: ["ecuador"],
  },
  {
    slug: "uruguay",
    team: "Uruguay",
    title: "Uruguay World Cup 2026 Fan Gear",
    description:
      "Shop Uruguay soccer fan gear for World Cup 2026, including caps, car flags, and souvenirs shipping across Canada.",
    intro:
      "Uruguay always shows up at the World Cup. Find fan gear for match days, watch parties, and celebrations across Canada.",
    terms: ["uruguay"],
  },
  {
    slug: "saudi-arabia",
    team: "Saudi Arabia",
    title: "Saudi Arabia World Cup 2026 Fan Gear",
    description:
      "Shop Saudi Arabia soccer fan gear for World Cup 2026, including caps, car flags, and souvenirs shipping across Canada.",
    intro:
      "Saudi Arabia made headlines at the last World Cup and brings passionate supporters. Find fan gear for match days and community celebrations across Canada.",
    terms: ["saudi arabia", "saudi"],
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
