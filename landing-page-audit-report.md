# Landing Page Audit Report

Date: 2026-05-14  
Scope: `web-b2c` home page, global layout, product discovery, cart/shipping messaging

## Executive Summary

The B2C landing page is functional and visually coherent, with a clear World Cup 2026 merchandising direction, working product sections, trust signals, and category/team links. The biggest issue is not visual polish, but promise consistency: the site repeatedly advertises free shipping over $99 while the shipping calculation currently disables that offer. This can create customer confusion at checkout and should be fixed before paid traffic or SEO pushes.

The page also leans heavily on a carousel hero, which makes the first impression dependent on timing and image readability. The product grid helps, but the above-the-fold experience would convert better if it made the primary value proposition, best-selling product, shipping promise, and key categories scannable without waiting for slides.

## Findings

### High Priority

1. Free shipping messaging conflicts with checkout logic

- Evidence:
  - `web-b2c/components/layout/announcement-bar.tsx` says: `CA FREE SHIPPING OVER $99 CAD`.
  - `web-b2c/components/store/trust-strip.tsx` says: `Free Shipping` / `On orders over $99 CAD`.
  - `web-b2c/lib/money.ts` has `FREE_SHIPPING_ENABLED = false`, so `calculateShipping()` always returns a province-based shipping rate.
- Impact:
  - A customer can see free shipping promised on the landing page, then be charged shipping in cart/checkout.
  - This is a trust and conversion risk, not just a copy issue.
- Recommendation:
  - Either enable the free shipping threshold or remove all free-shipping claims from the announcement bar, trust strip, metadata, and checkout-adjacent copy.

2. Google Search Console verification is still a placeholder

- Evidence:
  - `web-b2c/app/layout.tsx` sets `google: "google-site-verification-token-here"`.
- Impact:
  - Search Console verification will not work as-is.
  - SEO monitoring, indexing diagnostics, and sitemap issue tracking may be blocked.
- Recommendation:
  - Replace the placeholder with the real token or remove it until ready.

3. Landing page hero relies on image-embedded messaging

- Evidence:
  - `HeroCarousel` uses image-based hero slides and overlays only CTA buttons on some slides.
  - The first hero slide depends on `/asset/hero-banner.jpg` for its headline/value prop.
- Impact:
  - Text embedded in images is weaker for accessibility, localization, SEO, responsive control, and A/B testing.
  - On small screens, important copy can become hard to read or crop awkwardly.
- Recommendation:
  - Move the main value prop into real HTML text layered over or adjacent to the hero image.
  - Keep the product image as the visual anchor, but make headline, subcopy, price/promo, and CTA semantic HTML.

### Medium Priority

4. Carousel may hide the strongest offer

- Evidence:
  - `HeroCarousel` rotates between the general hero, sticker box, and bundle every 5 seconds.
  - Only one offer is visible at a time.
- Impact:
  - Visitors may miss the sticker box or bundle offer if they scroll quickly.
  - Carousels often underperform because secondary slides receive less attention.
- Recommendation:
  - Consider a static hero with the best bundle offer as the primary CTA.
  - Surface secondary offers as two compact promo tiles immediately below the hero.

5. Footer brand/legal positioning is clearer than the top of page

- Evidence:
  - Footer says: `Not affiliated with FIFA or any official organizing body.`
  - Home metadata and page copy lean heavily on `FIFA World Cup 2026` phrasing.
- Impact:
  - The affiliation disclaimer is present but only at the bottom.
  - For licensed-looking products such as Panini stickers, the difference between official product and site affiliation should stay clear.
- Recommendation:
  - Add a short, unobtrusive clarification near product/brand-heavy areas: official Panini products where applicable, store not affiliated with FIFA.

6. Product discovery is useful but could be more conversion-oriented

- Evidence:
  - Home page has Trending, TrustStrip, Featured Products, SocialProof, team links, gear links, and categories.
  - The order makes users scroll through multiple product grids before team/category shortcuts.
- Impact:
  - Users looking for a specific country or category may need to scan too much.
- Recommendation:
  - Move `Shop by Team` / `Shop by Gear` higher, ideally just after the hero or after Trending.
  - Add Canada, Mexico, Brazil, Argentina, France, and USA as highly visible quick links for Canada 2026 traffic.

7. Review section appears static and unverifiable

- Evidence:
  - `SocialProof` hardcodes three customer reviews without ratings source, dates, or review platform.
- Impact:
  - Generic reviews can help visually, but may not create much trust if they feel invented.
- Recommendation:
  - Add real source context when available, or replace with operational trust proof: Toronto shipping, return policy, secure payment, local support, processing time.

### Low Priority

8. Metadata includes `jerseys` even though jerseys are not a visible category

- Evidence:
  - `web-b2c/app/layout.tsx` keyword list includes `jerseys`.
  - Visible categories are caps, bucket hats, car flags, boxing gloves, and sticker packs.
- Impact:
  - Minor SEO relevance mismatch.
- Recommendation:
  - Replace with terms that match actual inventory: `World Cup caps`, `car flags`, `bucket hats`, `souvenir boxing gloves`, `Panini stickers`.

9. Announcement bar is all uppercase and fairly dense

- Evidence:
  - `AnnouncementBar` uses all-caps text with multiple claims in one line.
- Impact:
  - It scans as promotional noise and may be harder to read on mobile.
- Recommendation:
  - Shorten to one promise at a time, for example: `Ships from Toronto • Canada-wide delivery`.
  - If free shipping remains disabled, do not mention it.

10. Home page has no explicit newsletter, restock, or lead capture path

- Evidence:
  - Current CTAs focus on shopping and product browsing.
- Impact:
  - Visitors who are interested in World Cup 2026 but not ready to buy have no soft conversion.
- Recommendation:
  - Add a simple `Get restock and match-day gear alerts` signup once email infrastructure is ready.

## Suggested Fix Order

1. Resolve the free-shipping promise mismatch.
2. Replace Google verification placeholder.
3. Convert hero messaging from image-only text to semantic HTML.
4. Reorder landing sections so team/category shortcuts appear earlier.
5. Tighten SEO keywords and affiliation/disclaimer copy.
6. Replace generic reviews with real proof or operational trust content.

## Verification Notes

- `npm run lint` in `web-b2c` passed.
- Local home page returned HTTP 200 after the Next dev server finished compiling.
- Browser automation via `agent-browser` was attempted but unavailable in the current PATH, so this report is based on source review plus local HTML response inspection.
