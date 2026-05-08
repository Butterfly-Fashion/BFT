# web-b2c 개발 플랜 — World Fan Gear (fifa2026.ca)

> **워크플로우**
> - **"완료"** 입력 → Claude Code가 PLAN.md + DONE.md 확인 → 다음 태스크 파악 → PLAN.md 업데이트
> - Codex에게 넘길 태스크는 "M-X Codex에게 시키면 됩니다" + 명령어를 알려줌
> - 각 태스크 아래 `### Codex 명령어` 섹션에 실행할 명령어 저장
> - 완료 후 DONE.md에 기록

---

## 완료된 것 ✅

- 홈페이지, 상품 목록/상세 (정적 생성), 장바구니 페이지
- 체크아웃 폼, Stripe 연동, 주문 완료 페이지
- 비회원 결제 (guest checkout)
- 헤더/푸터 카테고리 네비게이션
- **Phase 1-A:** 헤더/푸터 nav 링크 → 실제 카테고리로 교체 (Boxing Gloves / Caps / Bucket Hats / Car Flags)
- **M-1:** 모바일 고정 결제 바 (`web-b2c/app/cart/page.tsx`)
- **M-2:** "Add to Cart" 토스트 알림
- **M-3:** 장바구니 슬라이드인 드로어
- **1-B~1-E:** 커스텀 404, 정책 페이지 4개, SEO (sitemap + robots.txt), vercel.json

---

## ▶ 다음 실행 태스크: M-2 ("Add to Cart" 토스트 알림)

**파일:** `web-b2c/app/cart/page.tsx`

현재 최상단 div: `<div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">`

**변경 1 — 최상단 div에 `pb-20 md:pb-0` 추가:**
```tsx
<div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 pb-20 md:pb-0">
```

**변경 2 — `items.length > 0` 분기의 return 블록 마지막 `</div>` 직전에 고정 바 삽입:**
```tsx
{/* Mobile sticky checkout bar */}
<div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
  <div className="text-sm">
    <span className="font-bold text-gray-900">{formatCAD(subtotal + shipping)}</span>
    <span className="text-gray-400 text-xs ml-1">
      {shipping === 0 ? "· Free shipping" : `· +${formatCAD(shipping)} shipping`}
    </span>
  </div>
  <Link
    href="/checkout"
    className="shrink-0 px-6 py-2.5 bg-[#C41E3A] text-white font-semibold rounded-full text-sm hover:bg-[#A01830] transition-colors"
  >
    Checkout →
  </Link>
</div>
```

고정 바는 기존 `<div className="max-w-6xl ...">` 바깥, return 블록 최상위에 배치.

**완료 기준:** 모바일에서 장바구니에 아이템이 있을 때 화면 하단에 합계 + Checkout 버튼이 항상 보임

---

## ✅ Phase 1 완료

M-1 ~ M-3 모바일 UX, 커스텀 404, 정책 페이지 4개, SEO, Vercel 설정 모두 완료.

---

## ▶ Phase 2: 다음 단계

### 2-A. Vercel 실제 배포
- Vercel 대시보드에서 `web-b2c` 디렉토리를 루트로 설정
- 환경변수 입력: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`

### 2-B. 상품 이미지 최적화
- 현재 외부 URL 직접 참조 중 → Vercel Image Optimization 또는 로컬 저장으로 전환

### 2-C. 주문 관리 (선택)
- Supabase `orders` 테이블에 주문 저장
- 관리자 주문 확인 페이지

### 2-D. 이메일 알림 (선택)
- Stripe webhook → 주문 확인 이메일 발송 (Resend 또는 SendGrid)

**파일 (신규):** `web-b2c/components/store/toast-provider.tsx`
**파일 (수정):** `web-b2c/app/layout.tsx`, `web-b2c/app/products/[slug]/product-actions.tsx`

- `toast-provider.tsx`: ToastContext + useToast hook + ToastProvider 컴포넌트
- Toast: 2000ms 후 사라짐, fixed bottom-6 center, bg-gray-900 text-white rounded-full
- layout.tsx: CartProvider 안에 ToastProvider로 감싸기
- product-actions.tsx: addItem() 호출 후 showToast("Added to cart ✓") 추가

**완료 기준:** 상품 상세 페이지에서 "Add to Cart" 클릭 시 화면 하단 중앙에 2초 토스트 표시

### Codex 명령어

```powershell
npx --yes codex --approval-mode full-auto "In the web-b2c Next.js app, implement an 'Add to Cart' toast notification system with no external libraries.

Step 1 — Create web-b2c/components/store/toast-provider.tsx:
- Add 'use client' directive
- Export ToastContext with { showToast(message: string): void }
- Export useToast hook that calls useContext(ToastContext)
- Export ToastProvider component that renders children + a fixed bottom-center toast
- Toast appears for 2000ms then disappears
- Use useState for message/visible, setTimeout to hide after 2000ms
- Style: fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm rounded-full px-4 py-2 shadow-lg
- Use Tailwind transition-opacity: opacity-100 when visible, opacity-0 when not

Step 2 — In web-b2c/app/layout.tsx:
- Import ToastProvider from @/components/store/toast-provider
- Wrap the existing CartProvider children with ToastProvider:
  <CartProvider><ToastProvider>...(Header, main, Footer)...</ToastProvider></CartProvider>

Step 3 — In web-b2c/app/products/[slug]/product-actions.tsx:
- Import useToast from @/components/store/toast-provider
- Call const { showToast } = useToast() inside the component
- After the addItem() call in handleAddToCart, add: showToast('Added to cart ✓')
- Do NOT change any other existing logic

After all edits, run: npm run lint --prefix web-b2c && npm run build --prefix web-b2c"
```

---

## Task M-3: 장바구니 슬라이드인 드로어

**파일 (신규):** `web-b2c/components/store/cart-drawer.tsx`
**파일 (수정):** `web-b2c/components/layout/header.tsx`

```
Step 1 — Create web-b2c/components/store/cart-drawer.tsx:
- "use client"
- Props: { open: boolean; onClose: () => void }
- Overlay: fixed inset-0 bg-black/40 z-40, click to close
- Panel: fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-xl
  translate-x transition-transform duration-300 (translate-x-full when closed,
  translate-x-0 when open)
- Header row: "Your Cart" title + X close button
- Scrollable item list using useCart().items
- Footer: subtotal row + "View Cart" Link(/cart) + "Checkout" Link(/checkout)
- Free shipping progress bar
- If cart is empty: centered "Your cart is empty" + "Browse Products" link

Step 2 — In web-b2c/components/layout/header.tsx:
- Add useState: const [drawerOpen, setDrawerOpen] = useState(false)
- Change cart icon from <Link href="/cart"> to <button onClick={() => setDrawerOpen(true)}>
- Import CartDrawer; render <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
```

**완료 기준:** 헤더 장바구니 아이콘 클릭 → 오른쪽 드로어 슬라이드인, X / 오버레이 클릭으로 닫힘

---

## Phase 1 잔여 — 런칭 전 완료 필요

### 1-B. 커스텀 404
`web-b2c/app/not-found.tsx` 신규 생성.
- "Page not found" 헤딩 + "Back to Shop" → /products 버튼

### 1-C. 정책 페이지 4개
`web-b2c/app/shipping/page.tsx`, `returns/page.tsx`, `faq/page.tsx`, `contact/page.tsx`

### 1-D. SEO
- `web-b2c/app/sitemap.ts`
- `web-b2c/public/robots.txt`

### 1-E. Vercel 배포
- `web-b2c/vercel.json`

---

## 실행 순서

```
M-1 → M-2 → M-3 → 1-B → 1-C → 1-D → 1-E
```

*Last updated: 2026-05-08 | 현재 작업: M-1 (모바일 고정 결제 바)*
