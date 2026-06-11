import type { CartItem } from "./types";

// Canada kit volume pricing.
// Base: adult sets $39.99, kids sets $34.99. The more jersey sets in the cart
// (any colour, adult and kids combined), the cheaper every set gets. At 8+ sets
// the team rate kicks in: $24.87/set ≈ $199 per 8 sets, same rate for all sets.
// Used by the product page, cart drawer, checkout page, and re-computed
// server-side in /api/checkout so client-tampered prices never reach Stripe.

export const ADULT_KIT_SLUGS = new Set([
  "canada-soccer-jersey-shorts-set-2026",
  "canada-away-jersey-shorts-set-2026",
]);

export const KIDS_KIT_SLUGS = new Set([
  "canada-home-kit-kids-2026",
  "canada-away-kit-kids-2026",
]);

export const JERSEY_KIT_SLUGS = new Set([...ADULT_KIT_SLUGS, ...KIDS_KIT_SLUGS]);

export const ADULT_BASE_PRICE = 39.99;
export const KIDS_BASE_PRICE = 34.99;

/** $199 per 8 sets — one rate for every set (adult or kids) once the cart hits 8. */
export const TEAM_RATE = 24.87;

// Highest tier first. minQty is the combined jersey-set quantity in the cart.
export const JERSEY_TIERS = [
  { minQty: 8, adult: TEAM_RATE, kids: TEAM_RATE, label: "8+ sets" },
  { minQty: 4, adult: 29.99, kids: 26.99, label: "4–7 sets" },
  { minQty: 2, adult: 34.99, kids: 30.99, label: "2–3 sets" },
  { minQty: 1, adult: ADULT_BASE_PRICE, kids: KIDS_BASE_PRICE, label: "1 set" },
] as const;

export function jerseyTierFor(totalKitQty: number) {
  for (const tier of JERSEY_TIERS) {
    if (totalKitQty >= tier.minQty) return tier;
  }
  return JERSEY_TIERS[JERSEY_TIERS.length - 1];
}

export function jerseyUnitPrice(totalKitQty: number, isKids: boolean): number {
  const tier = jerseyTierFor(totalKitQty);
  return isKids ? tier.kids : tier.adult;
}

export function countJerseyKits(items: Pick<CartItem, "slug" | "quantity">[]): number {
  return items.reduce(
    (sum, item) => (JERSEY_KIT_SLUGS.has(item.slug) ? sum + item.quantity : sum),
    0
  );
}

/** Returns the next tier above the current quantity, or null when already at the top. */
export function nextJerseyTier(totalKitQty: number) {
  if (totalKitQty <= 0) return null;
  const upgrades = [...JERSEY_TIERS].reverse().filter((t) => t.minQty > totalKitQty);
  return upgrades[0] ?? null;
}

/** Re-prices jersey kits according to the combined kit quantity. Other items pass through. */
export function applyJerseyTiers<T extends Pick<CartItem, "slug" | "price" | "quantity">>(
  items: T[]
): T[] {
  const kitQty = countJerseyKits(items);
  if (kitQty === 0) return items;
  return items.map((item) => {
    if (!JERSEY_KIT_SLUGS.has(item.slug)) return item;
    return { ...item, price: jerseyUnitPrice(kitQty, KIDS_KIT_SLUGS.has(item.slug)) };
  });
}
