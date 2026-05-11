import { products } from "@/lib/products";
import type { Product } from "@/lib/types";

export interface BlogSection {
  heading: string;
  body: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  heroImage: string;
  heroAlt: string;
  productSlugs: string[];
  sections: BlogSection[];
  faqs: Array<{ q: string; a: string }>;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "world-cup-2026-fan-gear-canada",
    title: "Best World Cup 2026 Fan Gear to Buy in Canada",
    description:
      "A practical Canada-based guide to World Cup 2026 fan gear, from car flags and caps to bucket hats and souvenir gifts.",
    publishedAt: "2026-05-11",
    category: "Fan Gear Guide",
    heroImage: "/asset/blog/canada-watch-party.png",
    heroAlt: "Canada 2026 fan gear banner with soccer merchandise",
    productSlugs: [
      "canada-boxing-glove",
      "canada-car-flag",
      "canada-black-flag-3d-embroidered-cap",
      "canada-reversible-bucket-hat",
    ],
    sections: [
      {
        heading: "Start with the gear people actually use",
        body: [
          "The best World Cup 2026 fan gear is easy to wear, easy to gift, and easy to bring to a watch party. For Canadian shoppers, that usually means caps, bucket hats, car flags, and small souvenirs that can ship quickly before tournament demand spikes.",
          "A good match-day setup does not need to be complicated. Pick one wearable item, one car or window item, and one small gift piece if you are shopping for family or friends.",
        ],
      },
      {
        heading: "Car flags are the high-visibility choice",
        body: [
          "Car flags are one of the most visible ways to show support during tournament season. They work for neighborhood drives, parade days, pickup games, and the trip to a watch party.",
          "If you are buying early, car flags are a smart first pick because they are easy to store and useful throughout the whole tournament.",
        ],
      },
      {
        heading: "Caps and bucket hats cover the outfit",
        body: [
          "Caps are the everyday option. Bucket hats feel more like an event piece, especially for outdoor screenings and summer fan zones.",
          "For gifting, a cap is usually the safest choice. For a louder match-day look, a bucket hat stands out more in photos and group events.",
        ],
      },
    ],
    faqs: [
      {
        q: "When should I buy World Cup 2026 fan gear in Canada?",
        a: "Buying early is usually better because popular country styles can sell out as the tournament gets closer.",
      },
      {
        q: "What is the easiest fan gear gift?",
        a: "Caps, car flags, and mini souvenir items are easy gifts because sizing is simple and they work for many types of fans.",
      },
    ],
  },
  {
    slug: "canada-world-cup-2026-party-ideas",
    title: "Canada World Cup 2026 Watch Party Ideas",
    description:
      "Simple ideas for hosting a Canada 2026 watch party with fan outfits, car flags, photo moments, and easy soccer decorations.",
    publishedAt: "2026-05-11",
    category: "Watch Parties",
    heroImage: "/asset/blog/canada-watch-party.png",
    heroAlt: "Canada soccer fan gear for a World Cup 2026 watch party",
    productSlugs: [
      "canada-boxing-glove",
      "canada-car-flag",
      "u-s-a-flag-3d-embroidered-cap",
      "mexico-with-national-football-team-flag-3d-embroidered-cap",
    ],
    sections: [
      {
        heading: "Build the party around colours",
        body: [
          "The easiest watch party theme is colour. Ask guests to wear their country colours, then add a few flags, caps, and souvenirs around the room for a match-day feel.",
          "If the party is casual, keep the decor simple. A car flag near the snack table, a few caps on display, and a group photo spot can do more than a full room makeover.",
        ],
      },
      {
        heading: "Make a pre-game ritual",
        body: [
          "Start the event before kickoff with predictions, a score sheet, and a quick group photo. Small rituals make the game feel more memorable and give people a reason to arrive on time.",
          "For family parties, mini souvenirs can be used as table markers or small prizes for correct score predictions.",
        ],
      },
      {
        heading: "Plan for repeat matches",
        body: [
          "The tournament lasts weeks, so choose fan gear that can be reused. Caps, bucket hats, and car flags work across multiple matches and are easy to bring to another host's house.",
        ],
      },
    ],
    faqs: [
      {
        q: "What should I buy for a World Cup watch party?",
        a: "Start with wearable fan gear, one or two flags, and a small souvenir item for photos or prizes.",
      },
      {
        q: "Do I need team-specific decorations?",
        a: "Team-specific gear helps, but a simple colour theme is enough for most watch parties.",
      },
    ],
  },
  {
    slug: "world-cup-car-flags-canada",
    title: "Where to Buy World Cup Car Flags in Canada",
    description:
      "A guide to choosing soccer car flags for World Cup 2026, including country styles, match-day uses, and buying early in Canada.",
    publishedAt: "2026-05-12",
    category: "Car Flags",
    heroImage: "/asset/blog/world-cup-car-flags.png",
    heroAlt: "Soccer fan car flag for World Cup 2026",
    productSlugs: [
      "canada-car-flag",
      "brazil-car-flag",
      "argentina-car-flag",
      "mexico-car-flag",
    ],
    sections: [
      {
        heading: "Why car flags spike before major tournaments",
        body: [
          "Car flags are one of the first things fans buy when a major soccer tournament gets close. They are public, affordable, and easy to use for parades, street celebrations, and the drive to a watch party.",
          "For World Cup 2026 in North America, Canadian demand could rise early because many fans will be planning local events, road trips, and watch parties well before kickoff.",
        ],
      },
      {
        heading: "Pick the right country style",
        body: [
          "If you support one team, buy that country first. If you are hosting mixed groups, Canada, Brazil, Argentina, Mexico, USA, and Portugal are useful styles to keep around because they cover many common fan communities.",
        ],
      },
      {
        heading: "Store them before game day",
        body: [
          "Buy early and store car flags flat or upright so the fabric keeps its shape. Keep them near your match-day bag so they are ready for the drive.",
        ],
      },
    ],
    faqs: [
      {
        q: "Are car flags good for World Cup watch parties?",
        a: "Yes. They are useful for the drive, parking lot photos, and decorating a party entrance.",
      },
      {
        q: "Which country car flags should retailers stock first?",
        a: "Canada, Mexico, USA, Brazil, Argentina, Portugal, Germany, France, and Italy are strong early options.",
      },
    ],
  },
  {
    slug: "best-soccer-gifts-canada",
    title: "Best Soccer Gifts for Fans in Canada",
    description:
      "Gift ideas for soccer fans in Canada, including caps, bucket hats, car flags, and souvenir mini boxing gloves.",
    publishedAt: "2026-05-12",
    category: "Gift Guide",
    heroImage: "/asset/blog/soccer-fan-gifts.png",
    heroAlt: "Canada mini boxing gloves souvenir gift for soccer fans",
    productSlugs: [
      "canada-boxing-glove",
      "brasil-flag-souvenir-mini-boxing-glove",
      "france-flag-souvenir-mini-boxing-glove",
      "u-s-a-flag-3d-embroidered-cap",
    ],
    sections: [
      {
        heading: "Choose gifts that do not need exact sizing",
        body: [
          "The safest soccer gifts are items with flexible sizing. Caps, bucket hats, car flags, and souvenir mini gloves are easier to buy than fitted apparel.",
          "If you are not sure which team someone supports, choose Canada 2026-inspired gear or a neutral match-day accessory.",
        ],
      },
      {
        heading: "Small souvenirs work for groups",
        body: [
          "Mini souvenirs are useful when you need several gifts at once. They can be used for party prizes, stocking stuffers, retail displays, or keepsakes for kids.",
        ],
      },
      {
        heading: "Match the gift to the fan",
        body: [
          "A car flag is great for a driver. A bucket hat is great for outdoor events. A cap is the everyday choice. A small souvenir is best for collectors and casual fans.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is a good soccer gift under $25 CAD?",
        a: "Car flags, caps, and mini souvenir items are usually strong gift options under $25 CAD.",
      },
      {
        q: "What should I buy for a soccer fan if I do not know their size?",
        a: "Choose a car flag, bucket hat, adjustable cap, or small souvenir instead of fitted clothing.",
      },
    ],
  },
  {
    slug: "world-cup-2026-host-cities-canada",
    title: "World Cup 2026 Canada Host Cities and Fan Gear Guide",
    description:
      "A Canada-focused guide to World Cup 2026 host city energy, match-day travel, and fan gear to prepare early.",
    publishedAt: "2026-05-13",
    category: "Tournament Guide",
    heroImage: "/asset/hero-banner.jpg",
    heroAlt: "Canada 2026 soccer fan gear and match-day merchandise",
    productSlugs: [
      "canada-car-flag",
      "canada-boxing-glove",
      "canada-black-flag-3d-embroidered-cap",
      "canada-reversible-bucket-hat",
    ],
    sections: [
      {
        heading: "Canada will feel the tournament before kickoff",
        body: [
          "World Cup 2026 will bring more than match days. In Canada, the buildup will show up in local watch parties, travel plans, retail displays, and community celebrations.",
          "That makes early fan gear planning useful. The closer the tournament gets, the more likely popular country items are to move quickly.",
        ],
      },
      {
        heading: "Think beyond the stadium",
        body: [
          "Most fans will experience the tournament at home, in restaurants, at outdoor screenings, or on the road. Caps, car flags, and small souvenirs fit those everyday match-day moments.",
        ],
      },
      {
        heading: "Prepare a reusable fan kit",
        body: [
          "A reusable fan kit can include a cap, a car flag, a portable souvenir, and a light layer in team colours. Keep it ready for each match day.",
        ],
      },
    ],
    faqs: [
      {
        q: "What fan gear is useful for World Cup 2026 in Canada?",
        a: "Wearable gear, car flags, and small souvenirs are practical because they work for watch parties, travel, and local celebrations.",
      },
      {
        q: "Should I buy fan gear before the tournament starts?",
        a: "Yes. Buying early gives you more selection before demand rises closer to match dates.",
      },
    ],
  },
  {
    slug: "how-to-decorate-car-world-cup",
    title: "How to Decorate Your Car for World Cup 2026",
    description:
      "Safe and simple car decoration ideas for World Cup 2026, including car flags, colour themes, and match-day driving tips.",
    publishedAt: "2026-05-13",
    category: "Car Flags",
    heroImage: "/asset/blog/world-cup-car-flags.png",
    heroAlt: "World Cup soccer car flag on a match-day vehicle",
    productSlugs: [
      "canada-car-flag",
      "argentina-car-flag",
      "brazil-car-flag",
      "portugal-car-flag",
    ],
    sections: [
      {
        heading: "Start with one clear focal point",
        body: [
          "The cleanest car decoration is usually one or two car flags in strong country colours. It reads clearly from a distance and does not require complicated setup.",
          "Avoid blocking windows, mirrors, lights, or plates. Fan gear should add colour without affecting visibility or safety.",
        ],
      },
      {
        heading: "Match the route to the moment",
        body: [
          "For a neighborhood drive, keep it simple. For a watch party, park where the flag is visible for photos. For a parade, make sure everything is secure before moving.",
        ],
      },
      {
        heading: "Remove and store after the match",
        body: [
          "After the game, remove your flags and store them indoors. This keeps colours cleaner and helps the gear last through the tournament.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I use car flags for multiple World Cup matches?",
        a: "Yes. Store them indoors between matches so they stay cleaner and last longer.",
      },
      {
        q: "What is the simplest World Cup car decoration?",
        a: "A country car flag is the simplest option because it is visible, reusable, and quick to set up.",
      },
    ],
  },
  {
    slug: "match-day-outfit-ideas-world-cup",
    title: "World Cup 2026 Match Day Outfit Ideas",
    description:
      "Easy match-day outfit ideas for World Cup 2026 using caps, bucket hats, country colours, and fan accessories.",
    publishedAt: "2026-05-14",
    category: "Style Guide",
    heroImage: "/asset/blog/soccer-fan-gifts.png",
    heroAlt: "Argentina bucket hat for a World Cup 2026 match-day outfit",
    productSlugs: [
      "argentina-flag-3d-embroidered-cap",
      "brasil-yellow-with-national-football-team-flag-3d-embroidered-cap",
      "france-flag-3d-embroidered-cap",
      "mexico-with-national-football-team-flag-3d-embroidered-cap",
    ],
    sections: [
      {
        heading: "Keep the base simple",
        body: [
          "Start with a simple shirt or jacket in a neutral colour, then add one bold country item. A cap or bucket hat can carry the whole look without making it feel overdone.",
        ],
      },
      {
        heading: "Use accessories for group photos",
        body: [
          "Accessories show up well in group photos. Bucket hats, caps, and small flags help everyone look connected even if outfits are different.",
        ],
      },
      {
        heading: "Dress for the setting",
        body: [
          "Outdoor watch party? Pick a bucket hat. Restaurant viewing? A cap is easier. Driving to a parade? Bring a car flag and keep the outfit comfortable.",
        ],
      },
    ],
    faqs: [
      {
        q: "What should I wear to a World Cup watch party?",
        a: "Wear team colours with one clear fan accessory such as a cap, bucket hat, scarf, or flag.",
      },
      {
        q: "Are bucket hats good for World Cup 2026?",
        a: "Yes. Bucket hats work well for summer matches, outdoor screenings, and photos.",
      },
    ],
  },
  {
    slug: "canada-soccer-fan-merchandise",
    title: "Canada Soccer Fan Merchandise Guide",
    description:
      "A guide to Canada soccer fan merchandise for 2026, including practical gear for watch parties, travel, and gifts.",
    publishedAt: "2026-05-14",
    category: "Canada Fan Gear",
    heroImage: "/asset/hero-banner.jpg",
    heroAlt: "Canada soccer fan merchandise for 2026",
    productSlugs: [
      "canada-car-flag",
      "canada-boxing-glove",
      "canada-blue-flag-3d-embroidered-cap",
      "canada-reversible-bucket-hat",
    ],
    sections: [
      {
        heading: "Canada gear will be a long season purchase",
        body: [
          "Canada fan merchandise is not just for one match. It can be used through qualifying stories, friendlies, watch parties, and the full 2026 tournament season.",
          "The most useful pieces are easy to reuse: caps, bucket hats, car flags, and small souvenirs.",
        ],
      },
      {
        heading: "Buy for the way you celebrate",
        body: [
          "If you host, choose decor and small gifts. If you travel, choose compact gear. If you attend outdoor events, choose hats and easy layers.",
        ],
      },
      {
        heading: "Make it easy for families",
        body: [
          "Families often need simple items that work for different ages. Adjustable caps, small souvenirs, and car flags are easier than size-specific apparel.",
        ],
      },
    ],
    faqs: [
      {
        q: "What Canada fan merchandise is easiest to buy online?",
        a: "Caps, car flags, bucket hats, and small souvenirs are easy online purchases because sizing is simple.",
      },
      {
        q: "Is Canada 2026 fan gear good for gifts?",
        a: "Yes. Canada-themed gear is a practical gift for soccer fans preparing for World Cup 2026.",
      },
    ],
  },
  {
    slug: "world-cup-bucket-hats",
    title: "Why Bucket Hats Are Perfect for World Cup Match Days",
    description:
      "Why bucket hats make sense for World Cup 2026 fans, from outdoor watch parties to summer match-day outfits.",
    publishedAt: "2026-05-15",
    category: "Bucket Hats",
    heroImage: "/asset/hero-banner.jpg",
    heroAlt: "Brazil World Cup 2026 bucket hat for match day",
    productSlugs: [
      "canada-reversible-bucket-hat",
      "barbados-reversible-bucket-hat",
      "italy-reversible-bucket-hat",
      "jamaica-reversible-bucket-hat",
    ],
    sections: [
      {
        heading: "Bucket hats are built for summer viewing",
        body: [
          "World Cup 2026 will bring plenty of outdoor viewing, patios, fan zones, and daytime events. Bucket hats are useful because they add shade while still making the outfit feel festive.",
        ],
      },
      {
        heading: "They stand out in photos",
        body: [
          "A bucket hat is easy to spot in group photos. It is more playful than a standard cap and works well when fans want a louder tournament look.",
        ],
      },
      {
        heading: "Choose by country colour",
        body: [
          "The simplest way to choose a bucket hat is by country colour. Match it with a plain shirt or hoodie so the hat remains the visual anchor.",
        ],
      },
    ],
    faqs: [
      {
        q: "Are bucket hats practical for World Cup 2026?",
        a: "Yes. They are useful for outdoor events, sunny patios, and fan zones.",
      },
      {
        q: "What should I wear with a World Cup bucket hat?",
        a: "Pair it with simple clothing in neutral or team colours so the hat stands out.",
      },
    ],
  },
  {
    slug: "world-cup-souvenirs-canada",
    title: "World Cup 2026 Souvenirs You Can Ship in Canada",
    description:
      "World Cup 2026-inspired souvenir ideas for Canadian shoppers, including mini boxing gloves, caps, car flags, and small gifts.",
    publishedAt: "2026-05-15",
    category: "Souvenirs",
    heroImage: "https://static.wixstatic.com/media/9098d0_68565164f45e4b33abf825eb5d9d99af~mv2.jpg",
    heroAlt: "Canada souvenir mini boxing gloves for soccer fans",
    productSlugs: [
      "canada-boxing-glove",
      "brasil-flag-souvenir-mini-boxing-glove",
      "portugal-flag-green-boxing-glove",
      "quebec-flag-souvenir-mini-boxing-glove",
    ],
    sections: [
      {
        heading: "Small souvenirs are easy to collect",
        body: [
          "The best souvenirs are small enough to keep, display, and gift. Mini boxing gloves, caps, and flags work well because they do not require much space and can be tied to a specific team or match.",
        ],
      },
      {
        heading: "Buy before the rush",
        body: [
          "As World Cup 2026 gets closer, souvenir demand may rise quickly. Buying early gives you more choice, especially for popular country colours.",
        ],
      },
      {
        heading: "Use souvenirs for party moments",
        body: [
          "Souvenirs can double as party prizes, table decor, or photo props. That makes them useful even if the buyer is not a collector.",
        ],
      },
    ],
    faqs: [
      {
        q: "What are good World Cup souvenirs for Canadian shoppers?",
        a: "Mini souvenir gloves, caps, car flags, and bucket hats are practical because they are easy to ship and gift.",
      },
      {
        q: "Can souvenirs be used for watch parties?",
        a: "Yes. Small souvenirs work well as prizes, table decor, and photo props.",
      },
    ],
  },
];

export function isPostPublished(post: BlogPost, now = new Date()): boolean {
  return new Date(`${post.publishedAt}T00:00:00-04:00`) <= now;
}

export function getPublishedPosts(now = new Date()): BlogPost[] {
  return blogPosts
    .filter((post) => isPostPublished(post, now))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getPostProducts(post: BlogPost) {
  return post.productSlugs
    .map((slug) => products.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product))
    .slice(0, 4);
}
