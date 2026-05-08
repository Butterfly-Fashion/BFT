# DONE

## 2026-05-08 - S-7 deployment setup check

- Confirmed `web-b2c/.env.local` exists and the required local values are set.
- Confirmed Vercel project `bft` is configured with Root Directory `web-b2c`.
- Confirmed `fifa2026.ca` and `www.fifa2026.ca` are aliased to `bft`.
- Added missing Vercel Production env vars:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `ADMIN_PASSWORD`
- Created Stripe sandbox webhook endpoint:
  - URL: `https://fifa2026.ca/api/stripe/webhook`
  - Events: `checkout.session.completed`, `checkout.session.expired`
- Updated local and Vercel `STRIPE_WEBHOOK_SECRET` from the new Stripe webhook endpoint.
- Deployed production to Vercel and confirmed the new deployment is aliased to `https://fifa2026.ca`.
- Live checks:
  - `/`, `/products`, `/admin` return 200.
  - `/api/admin/orders` returns 401 without password.
  - unsigned POST to `/api/stripe/webhook` returns 400, which is expected.
- Note: Stripe account currently reports as sandbox/test mode. Live payments still require live Stripe keys and a live-mode webhook endpoint.

## 2026-05-08 - S-1 product image gallery

- Created `web-b2c/components/store/product-gallery.tsx`.
- Updated `web-b2c/app/products/[slug]/page.tsx` to use the new gallery with a hover zoom main image and thumbnail selector.
- Verification:
  - `npm run lint` in `web-b2c` passed.
  - `npm run build` in `web-b2c` passed.

## 2026-05-08 - S-2 product trust badges

- Updated `web-b2c/app/products/[slug]/product-actions.tsx`.
- Added Free over $99, 14-day returns, and Secure checkout badges below the product CTAs.
- Verification:
  - `npm run lint` in `web-b2c` passed.
  - `npm run build` in `web-b2c` passed.

## 2026-05-08 - S-3 header search

- Updated `web-b2c/components/layout/header.tsx`.
- Added a search icon and slide-down search form that routes to `/products?search=...`.
- Updated `web-b2c/app/products/page.tsx` to filter by search and show empty search results.
- Verification:
  - `npm run lint` in `web-b2c` passed.
  - `npm run build` in `web-b2c` passed.

## 2026-05-08 - S-4 homepage sections

- Added `getTrendingProducts()` to `web-b2c/lib/products.ts`.
- Created `web-b2c/components/store/social-proof.tsx`.
- Updated `web-b2c/app/page.tsx` with Trending and Social Proof sections.
- Verification:
  - `npm run lint` in `web-b2c` passed.
  - `npm run build` in `web-b2c` passed.

## 2026-05-08 - S-5 checkout progress indicator

- Updated `web-b2c/app/checkout/page.tsx`.
- Added Cart / Information / Payment progress indicator above the checkout form.
- Verification:
  - `npm run lint` in `web-b2c` passed.
  - `npm run build` in `web-b2c` passed.

## 2026-05-08 - S-6 product sorting

- Created `web-b2c/components/store/product-sort-select.tsx`.
- Updated `web-b2c/app/products/page.tsx` with price/name sorting while preserving existing query params.
- Verification:
  - `npm run lint` in `web-b2c` passed.
  - `npm run build` in `web-b2c` passed.

## 2026-05-08 - C-1 cart readability improvements

- Updated `web-b2c/app/cart/page.tsx`.
- Replaced the text-only free-shipping reminder with a visual progress bar.
- Made cart item names/prices stronger and quantity controls larger for mobile touch.
- Made the order summary estimated total more prominent.
- Changed the main checkout CTA to include the estimated total.
- Updated `web-b2c/components/store/cart-drawer.tsx` with matching free-shipping progress and quantity control improvements.
- Verification:
  - `npm run lint` in `web-b2c` passed.
  - `npm run build` in `web-b2c` passed.

## 2026-05-08 - C-2 B2C product copy

- Created `web-b2c/lib/product-copy.ts`.
- Added B2C lifestyle descriptions by product category.
- Updated `web-b2c/lib/products.ts` so rendered product names/descriptions are cleaned up for shoppers instead of using B2B bulk-order copy.
- Verification:
  - `npm run lint` in `web-b2c` passed.
  - `npm run build` in `web-b2c` passed.

## 2026-05-08 - C-3 Stripe admin orders page

- Created `web-b2c/app/api/admin/orders/route.ts`.
- Created `web-b2c/app/admin/page.tsx`.
- `/admin?password=...` now checks `ADMIN_PASSWORD` and shows recent paid Stripe checkout sessions.
- Verification:
  - `npm run lint` in `web-b2c` passed.
  - `npm run build` in `web-b2c` passed.

## 2026-05-08 - C-4/C-5 setup follow-through

- Added `ADMIN_PASSWORD=` to `web-b2c/.env.example`.
- Confirmed `web-b2c/vercel.json` already has the expected production build settings.
- Confirmed `web-b2c/next.config.ts` already includes the current external product image hosts.
- Still required from the user: real production values for `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`, and `ADMIN_PASSWORD`.

## 2026-05-08 - Phase 1-A category navigation

- Updated `web-b2c/components/layout/header.tsx` nav links to match real product categories:
  `Shop All`, `Boxing Gloves`, `Caps`, `Bucket Hats`, `Car Flags`.
- Updated `web-b2c/components/layout/footer.tsx` Quick Links with the same category URLs.
- Verification:
  - `npm run lint` in `web-b2c` passed.
  - `npm run build` in `web-b2c` passed.
- No `LAST_ERROR.txt` was created because tests completed successfully.

## 2026-05-08 - Phase 1 잔여 (1-B ~ 1-E)

- **1-B** `web-b2c/app/not-found.tsx` — 커스텀 404 페이지
- **1-C** `shipping/`, `returns/`, `faq/`, `contact/` 정책 페이지 4개
- **1-D** `web-b2c/app/sitemap.ts`, `web-b2c/public/robots.txt` — SEO
- **1-E** `web-b2c/vercel.json` — Vercel 배포 설정
- lint + build 통과

## 2026-05-08 - M-3 장바구니 슬라이드인 드로어

- 신규: `web-b2c/components/store/cart-drawer.tsx` — 오버레이 + 슬라이드인 패널, 아이템 목록, 수량 조절, 삭제, 무료배송 바, 빈 카트 상태
- 수정: `web-b2c/components/layout/header.tsx` — 장바구니 아이콘을 Link → button으로 교체, CartDrawer 추가
- lint + build 통과

## 2026-05-08 - M-2 "Add to Cart" toast notification

- Created `web-b2c/components/store/toast-provider.tsx` (ToastContext, useToast, ToastProvider)
- Updated `web-b2c/app/layout.tsx`: wrapped with ToastProvider inside CartProvider
- Updated `web-b2c/app/products/[slug]/product-actions.tsx`: showToast("Added to cart ✓") after addItem()
- Toast: fixed bottom-center, 2000ms, no external libraries
- lint + build 통과

## 2026-05-08 - M-1 mobile sticky checkout bar

- Updated `web-b2c/app/cart/page.tsx`.
- Added extra mobile bottom padding to the cart content when the cart has items.
- Added a mobile-only sticky checkout bar with estimated total, shipping note, and checkout link.
- Verification:
  - `npm run lint` in `web-b2c` passed.
  - `npm run build` in `web-b2c` passed.

## 2026-05-08 - T-1 announcement bar

- Created `web-b2c/components/layout/announcement-bar.tsx`.
- Updated `web-b2c/app/layout.tsx` to render the announcement bar as the first child inside `<body>`.
- Announcement text: `CA FREE SHIPPING OVER $99 CAD - GAME DAY ESSENTIALS - SHIPS FROM TORONTO`.
- Verification:
  - `npm run lint` in `web-b2c` passed.
  - `npm run build` in `web-b2c` passed.
