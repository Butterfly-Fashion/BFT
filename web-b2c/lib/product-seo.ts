import type { Product } from "./types";

interface ProductSeoSection {
  heading: string;
  body: string;
}

interface ProductSeoFaq {
  q: string;
  a: string;
}

const TEAM_TERMS: Array<{ term: string; label: string }> = [
  { term: "canada", label: "Canada" },
  { term: "argentina", label: "Argentina" },
  { term: "brazil", label: "Brazil" },
  { term: "brasil", label: "Brazil" },
  { term: "france", label: "France" },
  { term: "germany", label: "Germany" },
  { term: "deutschland", label: "Germany" },
  { term: "mexico", label: "Mexico" },
  { term: "portugal", label: "Portugal" },
  { term: "spain", label: "Spain" },
  { term: "italy", label: "Italy" },
  { term: "italia", label: "Italy" },
  { term: "england", label: "England" },
  { term: "south korea", label: "South Korea" },
  { term: "japan", label: "Japan" },
  { term: "morocco", label: "Morocco" },
  { term: "nigeria", label: "Nigeria" },
  { term: "senegal", label: "Senegal" },
  { term: "usa", label: "USA" },
  { term: "u-s-a", label: "USA" },
  { term: "united states", label: "USA" },
];

function getProductTeam(product: Product): string {
  const haystack = `${product.name} ${product.slug}`.toLowerCase().replaceAll("-", " ");
  return TEAM_TERMS.find((item) => haystack.includes(item.term))?.label ?? "your team";
}

function categoryUse(product: Product): string {
  switch (product.category) {
    case "Caps":
      return "an easy everyday piece for match days, watch parties, fan zones, and summer streetwear";
    case "Bucket Hats":
      return "a practical outdoor fan piece for sunny screenings, stadium walks, patios, and group photos";
    case "Car Flags":
      return "a high-visibility way to bring team colour to match-day drives, parades, and watch party arrivals";
    case "Boxing Gloves":
      return "a compact souvenir for car mirrors, desks, shelves, party prizes, and collector displays";
    case "Sticker Packs":
      return "a collector-first purchase for opening sessions, album progress, duplicate swaps, and tournament memories";
    default:
      return "a simple fan gear piece for World Cup 2026 celebrations";
  }
}

function categoryGift(product: Product): string {
  switch (product.category) {
    case "Caps":
      return "Caps are strong gifts because they are useful before, during, and after the tournament, especially for fans who want something less size-sensitive than a jersey.";
    case "Bucket Hats":
      return "Bucket hats work well for outdoor fans because they are visible in photos and useful for warm-weather events across June and July.";
    case "Car Flags":
      return "Car flags are easy gifts for drivers and families because they do not require apparel sizing and can be reused across the full tournament.";
    case "Boxing Gloves":
      return "Mini souvenir gloves are a good add-on gift because they are small, affordable, and easy to display without taking up much space.";
    case "Sticker Packs":
      return "Sticker products make strong gifts for collectors because opening packs and filling the album becomes an activity, not just a product.";
    default:
      return "This product is a practical gift for fans getting ready for World Cup 2026.";
  }
}

export function productSeoSections(product: Product): ProductSeoSection[] {
  const team = getProductTeam(product);

  return [
    {
      heading: `Who it's for`,
      body: `${team} supporters who want ${categoryUse(product)}. A natural fit for Canada 2026 watch parties, match nights, and tournament travel.`,
    },
    {
      heading: "Match day use",
      body: `Pair with a car flag, cap, or souvenir piece for a complete match-day setup. Easy to wear, easy to pack, built for repeated use across the full tournament.`,
    },
    {
      heading: "Gifting & shipping",
      body: `${categoryGift(product)} Ships from Toronto across Canada — order early for the best selection before group-stage demand peaks.`,
    },
  ];
}

export function productSeoFaqs(product: Product): ProductSeoFaq[] {
  const team = getProductTeam(product);

  return [
    {
      q: `Is ${product.name} good for World Cup 2026 watch parties?`,
      a: `Yes. ${product.name} is a practical choice for ${team} fans preparing for watch parties, outdoor screenings, and match-day celebrations in Canada.`,
    },
    {
      q: `Does ${product.name} ship from Canada?`,
      a: "Yes. World Fan Gear ships orders from the Toronto area to Canadian customers, with delivery timing shown during checkout.",
    },
  ];
}

export function productFaqJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: productSeoFaqs(product).map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}
