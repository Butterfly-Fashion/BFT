// Client-safe sold-out list — no server imports so the cart provider can use it.
// Enforced in three layers: product data (lib/products.ts), the cart provider
// (items can't be added and stale ones are dropped on load), and /api/checkout.

// Only album-containing Panini products (soft + hard cover) are sold out.
// Sticker boxes and loose packs remain purchasable.
export const SOLD_OUT_PRODUCT_SLUGS = new Set([
  "panini-fifa-world-cup-2026-official-sticker-album",
  "panini-fifa-world-cup-2026-official-sticker-album-hard-cover",
  "panini-fifa-world-cup-2026-starter-kit-album-10-packs",
  "panini-fifa-world-cup-2026-bundle-album-sticker-box",
  "panini-fifa-world-cup-2026-bundle-hard-cover-sticker-box",
]);

export function isSoldOut(slug: string): boolean {
  return SOLD_OUT_PRODUCT_SLUGS.has(slug);
}
