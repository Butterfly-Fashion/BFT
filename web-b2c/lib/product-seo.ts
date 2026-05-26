import type { Product } from "./types";

interface ProductSeoSection {
  heading: string;
  body: string;
}

interface ProductSeoFaq {
  q: string;
  a: string;
}

interface ProductSeoLink {
  href: string;
  label: string;
}

const PRODUCT_GUIDES: Record<string, ProductSeoSection[]> = {
  "canada-reversible-bucket-hat": [
    {
      heading: "Why Canada fans choose it",
      body: "The Canada reversible bucket hat is built for the kind of World Cup 2026 days Toronto and Vancouver will have: bright afternoons, outdoor screens, patios, and long walks between transit, bars, and fan zones. It gives Canada supporters a visible red-and-white piece without needing a full jersey.",
    },
    {
      heading: "Where it fits best",
      body: "Use it for Toronto watch parties, backyard screenings, road trips, and group photos. The reversible design makes it easier to wear with different outfits, which matters when you are using the same fan gear across multiple group-stage matches.",
    },
  ],
  "canada-car-flag": [
    {
      heading: "Why Canada drivers buy it",
      body: "A Canada car flag is one of the fastest ways to turn a normal drive into a match-day moment. It works for school runs, office commutes, car parades, and the trip to a watch party without needing apparel sizing or outfit planning.",
    },
    {
      heading: "Best use case",
      body: "Put it on for match day, celebrations, and local fan gatherings, then remove it for highway driving or bad weather. For families and groups, car flags are often the most visible Canada soccer fan gear for the price.",
    },
  ],
  "panini-fifa-world-cup-2026-sticker-box-50-packs": [
    {
      heading: "Why collectors start with a box",
      body: "The 50-pack Panini sticker box is the right starting point for serious FIFA World Cup 2026 collectors because it creates enough pulls to make album progress feel real. It is also the easiest halftime activity for watch parties, families, and trading groups.",
    },
    {
      heading: "Best pairing",
      body: "Pair the box with the official album if you are starting from zero. If you already have the album, the box gives you the best opening session before duplicates become part of the trading strategy.",
    },
  ],
  "panini-fifa-world-cup-2026-bundle-album-sticker-box": [
    {
      heading: "Why the bundle makes sense",
      body: "The album plus 50-pack box bundle is the cleanest way to start collecting without splitting the order. It is strong for gifts because the recipient gets the organizing system and enough packs to begin filling pages immediately.",
    },
    {
      heading: "Who should buy it",
      body: "Choose the bundle for family watch parties, new collectors, soccer dads, and anyone who wants the tournament memory as much as the match-day product. It turns World Cup 2026 into a collecting project from day one.",
    },
  ],
};

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

function categoryBuyingGuide(product: Product, team: string): ProductSeoSection[] {
  switch (product.category) {
    case "Caps":
      return [
        {
          heading: `${team} cap buying notes`,
          body: `${product.name} is the lower-effort match-day choice for fans who want something wearable before and after the game. Caps work especially well for commutes, sports bars, casual Fridays, and outdoor screenings where a jersey can feel like too much.`,
        },
        {
          heading: "How to style it",
          body: "Pair it with a plain tee, hoodie, or team-colour layer. For World Cup 2026 in Canada, caps are also easy to pack for Toronto, Vancouver, Montreal, and Calgary watch weekends.",
        },
      ];
    case "Bucket Hats":
      return [
        {
          heading: `${team} bucket hat buying notes`,
          body: `${product.name} is strongest for outdoor World Cup settings: fan zones, patios, parks, backyard screens, and afternoon matches. The all-around brim gives it a practical reason to exist beyond just showing team colour.`,
        },
        {
          heading: "Why it photographs well",
          body: "Bucket hats show up clearly in crowd photos and group shots, which makes them useful for watch parties where everyone wants a visible team piece without committing to a full kit.",
        },
      ];
    case "Car Flags":
      return [
        {
          heading: `${team} car flag buying notes`,
          body: `${product.name} is made for the part of the tournament that happens before you arrive: the drive, the honk, the parking lot, and the post-win celebration. It is one of the easiest World Cup party supplies to reuse across the full schedule.`,
        },
        {
          heading: "Best match-day setup",
          body: "Use one flag per side for the most visible look, especially for car parades and neighborhood celebrations. Remove the flag before high-speed highway driving and store it flat between matches.",
        },
      ];
    case "Sticker Packs":
      return [
        {
          heading: "Sticker collecting notes",
          body: `${product.name} is for fans who want the tournament to last beyond one match. Stickers are strongest as a family activity, halftime routine, or collector gift because opening, sorting, and trading becomes part of the World Cup experience.`,
        },
        {
          heading: "Best match-day setup",
          body: "Open packs during halftime, keep duplicates in one pile, and trade after the final whistle. For Canada-based collectors, ordering early gives more time to complete the album before knockout-stage demand rises.",
        },
      ];
    default:
      return [
        {
          heading: "Buying notes",
          body: `${product.name} is a practical World Cup 2026 fan gear choice for Canadian watch parties, gifts, and match-day setups. It ships from the Toronto area and fits easily into a broader fan kit.`,
        },
      ];
  }
}

export function productSeoSections(product: Product): ProductSeoSection[] {
  const team = getProductTeam(product);

  const base = [
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

  return [...base, ...(PRODUCT_GUIDES[product.slug] ?? categoryBuyingGuide(product, team))];
}

export function productSeoLinks(product: Product): ProductSeoLink[] {
  const links: ProductSeoLink[] = [
    { href: "/collections/best-fifa-2026-merch-canada", label: "Best FIFA 2026 merch in Canada" },
    { href: "/collections/world-cup-party-supplies-canada", label: "World Cup party supplies Canada" },
  ];

  if (product.name.toLowerCase().includes("canada")) {
    links.unshift({ href: "/collections/canada-soccer-fan-gear", label: "Canada soccer fan gear" });
  }

  if (product.category === "Bucket Hats") {
    links.unshift({ href: "/collections/world-cup-bucket-hats-toronto", label: "World Cup bucket hats Toronto" });
  }

  if (product.category === "Caps" || product.category === "Car Flags" || product.category === "Bucket Hats") {
    links.push({ href: "/collections/world-cup-fan-gear-toronto", label: "World Cup fan gear Toronto" });
  }

  return links.slice(0, 4);
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
