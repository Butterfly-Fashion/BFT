// Wholesale mode: the storefront is run as a B2B lead-gen site, not a retail
// shop. Prices and checkout are hidden; every buying surface points visitors to
// the B2B site to request wholesale pricing. Flip WHOLESALE_MODE to false to
// restore the full retail storefront.
export const WHOLESALE_MODE = true;

// Where "Get B2B pricing" CTAs send visitors (the wholesale site).
export const B2B_CONTACT_URL =
  process.env.NEXT_PUBLIC_B2B_URL ?? "https://www.mask12.com";

export const WHOLESALE_TAGLINE = "Wholesale only — contact us for B2B pricing";
export const WHOLESALE_CTA_LABEL = "Get B2B Pricing";
