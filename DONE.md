# DONE

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
