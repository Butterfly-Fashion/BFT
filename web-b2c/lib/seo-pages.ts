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
