// SEO landing pages targeting high-intent Canadian wholesale search queries.
// Each entry renders at /wholesale/<slug> via app/wholesale/[topic]/page.tsx.

export type WholesaleLanding = {
  slug: string;
  /** <title> + H1 */
  h1: string;
  metaTitle: string;
  metaDescription: string;
  /** Lead paragraph shown under the H1. */
  intro: string;
  /** Key selling points. */
  highlights: string[];
  /** Who this page is for — retail buyer segments. */
  buyers: string[];
  faqs: { q: string; a: string }[];
};

const SHARED_HIGHLIGHTS = [
  "Canadian inventory — stocked in Toronto, no long overseas lead times",
  "True wholesale pricing — bulk tiers, no minimum order",
  "Fast shipping across Canada & the USA",
  "Net terms available for approved accounts",
];

const SHARED_BUYERS = [
  "Dollar & variety stores",
  "Toy & hobby shops",
  "Gift shops & boutiques",
  "Convenience stores",
  "Arcades & entertainment venues",
  "School & fundraiser organizers",
];

export const WHOLESALE_LANDINGS: WholesaleLanding[] = [
  {
    slug: "squishy-canada",
    h1: "Wholesale Squishy Toys in Canada",
    metaTitle: "Wholesale Squishy Toys Canada — Bulk Supplier",
    metaDescription:
      "Buy squishy toys wholesale in Canada. Bulk pricing, Canadian inventory in Toronto, fast shipping across Canada & the USA. Request our wholesale catalog.",
    intro:
      "Butterfly Fashion Trading is a Canadian wholesale supplier of squishy toys. We stock popular squishies in Toronto and ship bulk orders across Canada and the USA — no overseas wait, no per-piece retail markup.",
    highlights: SHARED_HIGHLIGHTS,
    buyers: SHARED_BUYERS,
    faqs: [
      { q: "Where can I buy wholesale squishies in Canada?", a: "Butterfly Fashion Trading supplies squishy toys wholesale from our Toronto warehouse, shipping across Canada and the USA. Request the catalog for current bulk pricing." },
      { q: "What is the minimum order for squishy toys?", a: "There's no minimum — order any quantity, from a single unit to full cases. Larger volumes qualify for lower bulk pricing tiers." },
      { q: "How fast do wholesale squishy orders ship?", a: "In-stock items ship from Canada, typically within 1–2 business days of an approved order." },
    ],
  },
  {
    slug: "bulk-squishy-supplier",
    h1: "Bulk Squishy Supplier",
    metaTitle: "Bulk Squishy Supplier — Canadian Wholesale",
    metaDescription:
      "Bulk squishy supplier based in Canada. Case and pallet quantities, wholesale pricing, fast domestic shipping. Request a catalog and bulk quote.",
    intro:
      "Looking for a reliable bulk squishy supplier? We carry squishies in case and pallet quantities with wholesale pricing, stocked and shipped from Toronto, Canada.",
    highlights: SHARED_HIGHLIGHTS,
    buyers: SHARED_BUYERS,
    faqs: [
      { q: "Do you sell squishies by the case or pallet?", a: "Any quantity — from a single unit to full cases and pallets, with better pricing at higher volumes." },
      { q: "Can I get a bulk quote?", a: "Yes — request our catalog with your expected quantity and we'll send wholesale pricing." },
    ],
  },
  {
    slug: "sensory-toy-wholesale",
    h1: "Sensory Toy Wholesale in Canada",
    metaTitle: "Sensory Toy Wholesale Canada — Bulk Pricing",
    metaDescription:
      "Wholesale sensory toys for Canadian retailers. Fidgets, squishies and stress toys in bulk, stocked in Toronto, shipped across Canada. Request the catalog.",
    intro:
      "We supply sensory toys wholesale to Canadian retailers — squishies, fidgets, and stress-relief toys in bulk, with Canadian inventory and fast domestic shipping.",
    highlights: SHARED_HIGHLIGHTS,
    buyers: SHARED_BUYERS,
    faqs: [
      { q: "What sensory toys do you stock wholesale?", a: "Squishies, fidget toys, stress balls and related novelty/sensory items, in case quantities." },
      { q: "Do you supply schools and therapists?", a: "Yes — approved organizations and resellers can order at wholesale pricing." },
    ],
  },
  {
    slug: "fidget-toy-distributor",
    h1: "Fidget Toy Distributor in Canada",
    metaTitle: "Fidget Toy Distributor Canada — Wholesale",
    metaDescription:
      "Canadian fidget toy distributor. Wholesale fidget and novelty toys in bulk, Toronto inventory, fast shipping across Canada & the USA. Request the catalog.",
    intro:
      "Butterfly Fashion Trading distributes fidget and novelty toys wholesale across Canada. Buy in bulk from Canadian stock and skip the overseas import hassle.",
    highlights: SHARED_HIGHLIGHTS,
    buyers: SHARED_BUYERS,
    faqs: [
      { q: "Are you a Canadian fidget toy distributor?", a: "Yes — we're based in Toronto and ship wholesale fidget toys across Canada and the USA." },
      { q: "What are your wholesale terms?", a: "No minimum order, bulk pricing tiers, and net terms for approved accounts." },
    ],
  },
  {
    slug: "custom-squishy-orders",
    h1: "Custom & Bulk Squishy Orders",
    metaTitle: "Custom Squishy Orders — Canadian Wholesale",
    metaDescription:
      "Place custom and large-volume squishy orders with a Canadian wholesale supplier. Bulk pricing, assortment planning, domestic shipping. Request a quote.",
    intro:
      "Need a large or tailored squishy assortment? We handle custom and bulk squishy orders for Canadian retailers — tell us your volume and mix, and we'll build a wholesale quote.",
    highlights: SHARED_HIGHLIGHTS,
    buyers: SHARED_BUYERS,
    faqs: [
      { q: "Can I order a custom squishy assortment?", a: "Yes — share your target quantity and product mix in the catalog request and we'll prepare a custom quote." },
      { q: "Is there a minimum for custom orders?", a: "Custom and bulk orders start at one case per item; larger volumes unlock better pricing." },
    ],
  },
];

export function getWholesaleLanding(slug: string) {
  return WHOLESALE_LANDINGS.find((l) => l.slug === slug);
}
