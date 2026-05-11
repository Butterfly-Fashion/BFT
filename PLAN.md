# web-b2c 개발 플랜 — World Fan Gear (fifa2026.ca)

> **워크플로우**
> - **"완료"** 입력 → Claude Code가 PLAN.md + DONE.md 확인 → 다음 태스크 직접 구현 또는 Codex 명령어 제공
> - Codex 태스크는 "S-X Codex에게 시키면 됩니다" + `### Codex 명령어` 섹션 참고

---

## 완료된 것 ✅

- 홈, 상품목록/상세, 장바구니, 체크아웃, Stripe 연동, 주문완료
- 비회원 결제, 헤더/푸터 네비, Butterfly 브랜딩
- M-1(모바일 결제바), M-2(토스트), M-3(장바구니 드로어)
- 커스텀 404, 정책 페이지 4개, SEO, vercel.json
- Hero 배너 (Canada Pride 이미지 + Shop Now 버튼)
- T-1: Announcement Bar
- C-1: 장바구니 가독성 (progress bar, 수량 버튼, 총액 강조)
- C-2: 상품명/설명 B2C 감성화 (product-copy.ts)
- C-3: 관리자 페이지 (Stripe 기반, /admin?password=)
- **장바구니 드로어 완전 재작성** (Lucide 아이콘, 80px 썸네일, 가격×수량 표시, Minus/Plus 버튼)

---

## 🔑 필요한 API 키 (코드 준비 완료, 키만 입력하면 됨)

| 키 | 발급처 | 용도 |
|---|---|---|
| `STRIPE_SECRET_KEY` | stripe.com → Developers → API Keys | 결제 처리 |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → endpoint 등록 후 | 결제 완료 검증 |
| `NEXT_PUBLIC_SITE_URL` | 직접 입력 (`https://fifa2026.ca`) | 리다이렉트 URL |
| `ADMIN_PASSWORD` | 직접 설정 | 관리자 페이지 |
| Supabase 3개 키 | supabase.com (B2B와 동일 계정 재사용 가능) | 주문 DB (선택) |

> `web-b2b/.env.local`에서 Supabase + Stripe 테스트 키 복사 가능

---

## 🚀 Shopify급 쇼핑 경험 로드맵

---

## ▶ S-1: 상품 페이지 이미지 갤러리

**현재:** 이미지 1장 고정
**목표:** Shopify처럼 메인 이미지 + 썸네일 클릭으로 전환

**파일 (수정):** `web-b2c/app/products/[slug]/page.tsx`
**파일 (신규):** `web-b2c/components/store/product-gallery.tsx`

### Codex 명령어

```powershell
npx --yes codex --approval-mode full-auto "In web-b2c, add a product image gallery component.

Step 1 — Create web-b2c/components/store/product-gallery.tsx:
- 'use client'
- Props: { src: string; alt: string; placeholderGradient: string }
- useState for selectedImage (starts as src)
- Main image: large square (aspect-square), rounded-2xl, overflow-hidden, relative, uses ProductImage
- Below main: row of 2 placeholder thumbnails using the same image (real multi-image support needs product data changes, so for now show 1 clickable thumbnail)
- Add zoom effect: on hover main image scales to 110% (group-hover:scale-110 transition-transform duration-300)
- Export: export function ProductGallery()

Step 2 — In web-b2c/app/products/[slug]/page.tsx:
- Import ProductGallery
- Replace the existing image display block with <ProductGallery src={product.imageUrl} alt={product.name} placeholderGradient={product.placeholderGradient} />

Run: npm run lint --prefix web-b2c && npm run build --prefix web-b2c"
```

---

## Task S-2: 상품 페이지 신뢰 뱃지 (Trust Badges)

**현재:** 없음
**목표:** 상품 페이지 Add to Cart 버튼 아래에 배송/반품/보안 배지 표시 (Shopify 스타일)

**파일 (수정):** `web-b2c/app/products/[slug]/product-actions.tsx`

### Codex 명령어

```powershell
npx --yes codex --approval-mode full-auto "In web-b2c/app/products/[slug]/product-actions.tsx, add trust badges below the Buy Now button.

Add this JSX after the closing </div> of the CTAs section (after Buy Now button div):
<div className='mt-5 pt-5 border-t border-gray-100 grid grid-cols-3 gap-3 text-center'>
  <div className='flex flex-col items-center gap-1'>
    <span className='text-xl'>🚚</span>
    <span className='text-[11px] font-semibold text-gray-600'>Free over \$99</span>
  </div>
  <div className='flex flex-col items-center gap-1'>
    <span className='text-xl'>↩️</span>
    <span className='text-[11px] font-semibold text-gray-600'>14-day returns</span>
  </div>
  <div className='flex flex-col items-center gap-1'>
    <span className='text-xl'>🔒</span>
    <span className='text-[11px] font-semibold text-gray-600'>Secure checkout</span>
  </div>
</div>

Run: npm run lint --prefix web-b2c && npm run build --prefix web-b2c"
```

---

## Task S-3: 헤더 검색 바

**현재:** 검색 없음
**목표:** 헤더에 검색 아이콘 → 클릭시 검색 입력창 + /products?search=XXX 이동

**파일 (수정):** `web-b2c/components/layout/header.tsx`
**파일 (수정):** `web-b2c/app/products/page.tsx`

### Codex 명령어

```powershell
npx --yes codex --approval-mode full-auto "In web-b2c, add product search functionality.

Step 1 — In web-b2c/components/layout/header.tsx:
- Import Search from lucide-react, useRouter from next/navigation, useRef from react
- Add state: const [searchOpen, setSearchOpen] = useState(false); const [searchQ, setSearchQ] = useState('')
- Add a Search icon button next to the cart button (before cart button):
  <button onClick={() => setSearchOpen(v => !v)} aria-label='Search' className='p-1 text-gray-700 hover:text-[#C41E3A] transition-colors'>
    <Search className='w-5 h-5' />
  </button>
- When searchOpen, show a full-width search input below the header bar (same slide-down animation as mobile nav):
  <div className={clsx('border-t border-gray-100 bg-white overflow-hidden transition-all duration-200', searchOpen ? 'max-h-20' : 'max-h-0')}>
    <form onSubmit={(e) => { e.preventDefault(); if (searchQ.trim()) { router.push('/products?search=' + encodeURIComponent(searchQ.trim())); setSearchOpen(false); setSearchQ(''); } }} className='flex items-center gap-3 px-4 py-3'>
      <Search className='w-4 h-4 text-gray-400 shrink-0' />
      <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder='Search products...' className='flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400' autoFocus />
      <button type='submit' className='text-xs font-semibold text-[#C41E3A] hover:underline'>Go</button>
    </form>
  </div>

Step 2 — In web-b2c/app/products/page.tsx:
- The page already uses searchParams for category filtering
- Add search filtering: get search = searchParams.search ?? ''
- Filter products: if search, filter where product.name.toLowerCase().includes(search.toLowerCase())
- Show 'Results for \"{search}\"' heading when search is active
- If no results: show 'No products found for \"{search}\"' with a link to clear search

Run: npm run lint --prefix web-b2c && npm run build --prefix web-b2c"
```

---

## Task S-4: 홈페이지 Trending + Bundle + Social Proof 섹션

**현재:** Hero → TrustStrip → Featured → CategoryStrip → Promo 뿐
**목표:** 풍부한 홈 콘텐츠

### Codex 명령어

```powershell
npx --yes codex --approval-mode full-auto "In web-b2c app/page.tsx, add three new homepage sections.

Step 1 — In web-b2c/lib/products.ts, add after getFeaturedProducts():
export function getTrendingProducts(): Product[] {
  const canada = products.filter(p => p.name.toLowerCase().includes('canada'));
  const rest = products.filter(p => !p.name.toLowerCase().includes('canada'));
  return [...canada, ...rest].slice(0, 4);
}

Step 2 — Create web-b2c/components/store/social-proof.tsx (server component):
- Section: bg-gray-50 py-14
- Heading: 'Loved by Canadian Fans ⭐'
- 3 review cards (grid-cols-1 sm:grid-cols-3):
  { stars: 5, quote: 'Perfect for game day! Got so many compliments at the match.', name: 'Sarah M., Toronto', product: 'Canada Cap' }
  { stars: 5, quote: 'Shipped super fast. Quality is amazing for the price!', name: 'James K., Vancouver', product: 'Boxing Gloves' }
  { stars: 5, quote: 'Love it. The whole family is geared up for 2026! 🇨🇦', name: 'Alex R., Montreal', product: 'Car Flag Bundle' }
- Each card: bg-white rounded-2xl p-6 shadow-sm border border-gray-100
- Stars: '★★★★★' in text-[#C41E3A] text-sm

Step 3 — In web-b2c/app/page.tsx:
- Import getTrendingProducts, SocialProof
- Add const trending = getTrendingProducts()
- Page order:
  1. <Hero />
  2. NEW: Trending section (same grid as featured, heading 'Trending for Canada 2026 🇨🇦')
  3. <TrustStrip />
  4. Featured Products (existing)
  5. NEW: <SocialProof />
  6. <CategoryStrip />
  7. Promo Banner (existing)

Run: npm run lint --prefix web-b2c && npm run build --prefix web-b2c"
```

---

## Task S-5: 체크아웃 진행 표시 + 주문 요약 개선

**현재:** 긴 단일 폼, 요약 없음
**목표:** 상단 Step indicator (Cart → Info → Payment), 폼 옆에 주문 요약 sticky

**파일 (수정):** `web-b2c/app/checkout/page.tsx`

### Codex 명령어

```powershell
npx --yes codex --approval-mode full-auto "In web-b2c/app/checkout/page.tsx, add a step progress indicator at the top.

Add this JSX before the form element (after the h1):
<div className='flex items-center gap-0 mb-10'>
  {['Cart', 'Information', 'Payment'].map((step, i) => (
    <div key={step} className='flex items-center'>
      <div className='flex items-center gap-2'>
        <div className={['w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', i === 1 ? 'bg-[#C41E3A] text-white' : i < 1 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-400'].join(' ')}>
          {i < 1 ? '✓' : i + 1}
        </div>
        <span className={['text-sm font-semibold', i === 1 ? 'text-gray-900' : 'text-gray-400'].join(' ')}>{step}</span>
      </div>
      {i < 2 && <div className='w-8 h-px bg-gray-200 mx-3' />}
    </div>
  ))}
</div>

Run: npm run lint --prefix web-b2c && npm run build --prefix web-b2c"
```

---

## Task S-6: 상품 목록 필터 + 정렬

**현재:** 카테고리 필터만 (URL param)
**목표:** 가격순 정렬, 카테고리 사이드바 필터

**파일 (수정):** `web-b2c/app/products/page.tsx`

### Codex 명령어

```powershell
npx --yes codex --approval-mode full-auto "In web-b2c/app/products/page.tsx, add sort functionality.

1. Read sortBy from searchParams: const sortBy = searchParams.sort ?? 'default'
2. After category filtering, apply sort:
   if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price)
   if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price)
   if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name))
3. Add a sort dropdown above the product grid (right-aligned):
   <select onChange with router.push to update ?sort= param>
   Options: Default, Price: Low to High, Price: High to Low, Name A-Z
   Style: text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white

Run: npm run lint --prefix web-b2c && npm run build --prefix web-b2c"
```

---

## Task S-7: 도메인 이전 (fifa2026.ca B2B → B2C)

**선행 조건:** S-1~S-5 완료 + `.env.local` 키 입력 완료

### 실행 순서

```
1. web-b2c/.env.local 생성 (web-b2b/.env.local 참고)
   STRIPE_SECRET_KEY=sk_test_...  (B2B에서 복사)
   STRIPE_WEBHOOK_SECRET=whsec_... (B2C용 새로 발급)
   NEXT_PUBLIC_SUPABASE_URL=...   (B2B에서 복사)
   NEXT_PUBLIC_SUPABASE_ANON_KEY=... (B2B에서 복사)
   SUPABASE_SERVICE_ROLE_KEY=...  (B2B에서 복사)
   NEXT_PUBLIC_SITE_URL=https://fifa2026.ca
   ADMIN_PASSWORD=원하는비밀번호

2. Vercel에 B2C 프로젝트 신규 생성
   - Root Directory: web-b2c
   - 위 env 변수 입력

3. Vercel B2B 프로젝트 → Settings → Domains → fifa2026.ca 제거

4. Vercel B2C 프로젝트 → Settings → Domains → fifa2026.ca 추가
   - A record: 76.76.21.21
   - CNAME www: cname.vercel-dns.com

5. Stripe Webhook B2C 등록
   URL: https://fifa2026.ca/api/stripe/webhook
   Events: checkout.session.completed, checkout.session.expired
```

---

## Codex 작업 기록 (Claude와 별도)

> 아래 항목은 Claude 플랜이 아니라 Codex가 직접 확인/실행/제안한 내용입니다.

### 2026-05-11 - Vercel 연결 및 관측 도구

**완료**

- Vercel 프로젝트 `bft` 확인
  - Project ID: `prj_VrxekqWZnY6RaVfnPuQYO3PNJDBK`
  - Root Directory: `web-b2c`
  - Production URL: `https://fifa2026.ca`
- GitHub 저장소 연결 확인
  - `HangyeomLee/BFT`
  - Vercel Git integration은 이미 연결된 상태
- Custom domain 연결 확인
  - `fifa2026.ca`
  - `www.fifa2026.ca`
  - DNS 확인: apex는 `76.76.21.21`, www는 `cname.vercel-dns.com`
- Vercel Web Analytics 활성화
- Vercel Speed Insights 활성화
- `web-b2c`와 `web-b2b`에 Analytics/Speed Insights 컴포넌트 추가
  - `@vercel/analytics`
  - `@vercel/speed-insights`
- Preview Deployment 생성
  - `https://bft-ejnu0udb6-hangyeomlees-projects.vercel.app`
  - Status: `READY`
- 검증
  - `npm run lint:b2c` 통과
  - `npm run lint:b2b` 통과
  - `https://fifa2026.ca` HTTP 200 확인
- 커밋 및 푸시
  - Commit: `5961d48 Enable Vercel analytics`
  - Branch: `master`
  - Remote: `origin/master`

**주의**

- Preview URL은 Vercel Authentication 때문에 외부에서 직접 접속 시 `401`이 날 수 있음.
- 기존 로컬 변경은 커밋하지 않고 남겨둠:
  - `web-b2c/.next-dev.err.log`
  - `web-b2c/.next-dev.log`
  - `web-b2c/app/admin/page.tsx`
  - `web-b2c/app/api/admin/orders/route.ts`
  - `web-b2c/app/api/checkout/route.ts`
  - `web-b2c/app/checkout/page.tsx`
  - `.env.prod.tmp`

### 2026-05-11 - Google SEO 방향 제안

**핵심 전략**

- 월드컵 전까지 Google에 미리 인덱싱될 SEO 자산을 깔아둔다.
- 우선순위는 `상품 페이지 -> 카테고리/국가 랜딩 페이지 -> 블로그/가이드` 순서.
- 라이선스 이슈를 피하기 위해 `official FIFA` 같은 표현은 피하고, `World Cup-inspired`, `Canada 2026 fan gear`, `soccer fan merchandise` 중심으로 작성한다.

**우선 구현 아이디어**

1. 상품 페이지 SEO 강화
   - 상품별 `title`, `description`, Open Graph 개선
   - `Product`, `Offer`, `BreadcrumbList` JSON-LD 추가
   - 상품명 패턴 예시:
     - `Canada Car Flag for World Cup 2026`
     - `Argentina World Cup 2026 Bucket Hat`
     - `Brazil Soccer Fan Car Flag`

2. 카테고리 랜딩 페이지 추가
   - `/collections/world-cup-caps`
   - `/collections/world-cup-bucket-hats`
   - `/collections/world-cup-car-flags`
   - `/collections/souvenir-boxing-gloves`
   - `/collections/canada-2026-fan-gear`

3. 국가별 랜딩 페이지 추가
   - `/teams/canada`
   - `/teams/argentina`
   - `/teams/brazil`
   - `/teams/france`
   - `/teams/germany`
   - `/teams/mexico`
   - `/teams/portugal`
   - `/teams/spain`
   - `/teams/usa`

4. 블로그/가이드 페이지 추가
   - `/world-cup-2026-fan-gear-canada`
   - `/canada-world-cup-2026-party-ideas`
   - `/world-cup-car-flags-canada`
   - `/best-soccer-gifts-canada`
   - `/world-cup-2026-host-cities-canada`
   - `/how-to-decorate-car-world-cup`
   - `/match-day-outfit-ideas-world-cup`
   - `/canada-soccer-fan-merchandise`
   - `/world-cup-bucket-hats`
   - `/world-cup-souvenirs-canada`

5. 기술 SEO 정리
   - `metadataBase` 추가
   - canonical URL 정리
   - `/cart`, `/checkout`, `/order-confirmation`, `/admin` noindex 처리
   - sitemap에 collections/blog/teams 포함
   - FAQ 페이지에 `FAQPage` JSON-LD 추가
   - 사이트 전체에 `Organization`, `WebSite`, `SearchAction` JSON-LD 추가

**Codex 추천 실행 순서**

```
SEO-1: metadataBase/canonical/noindex 정리 - 완료 (2026-05-11 Codex)
SEO-2: 상품 페이지 Product + Offer + Breadcrumb JSON-LD - 완료 (2026-05-11 Codex)
SEO-3: FAQPage + Organization + WebSite JSON-LD - 완료 (2026-05-11 Codex)
SEO-4: 카테고리 랜딩 페이지 5개 - 완료 (2026-05-11 Codex)
SEO-5: 국가별 랜딩 페이지 9개 - 완료 (2026-05-11 Codex)
SEO-6: 블로그/가이드 10개 - 완료 (2026-05-11 Codex, 2026-05-11~2026-05-15 하루 2개 예약 발행)
SEO-7: sitemap 자동 확장 - 완료 (2026-05-11 Codex) / Search Console 제출 필요
```

---

## 실행 순서

```
S-1 (이미지 갤러리) → S-2 (Trust Badges) → S-3 (검색) → S-4 (홈 섹션) → S-5 (체크아웃 스텝) → S-6 (정렬 필터) → S-7 (도메인 이전)
```

---

## 🔍 SEO 상세 실행 플랜 (2026-05-11 기준)

> **카운트다운:** 오늘(5/11) → 개막(6/11) = 30일.
> Google 인덱싱 2~4주 소요 → **지금 만드는 콘텐츠가 개막 직전에 뜸.**
> 이 창이 1~2주 안에 닫힘.

---

### [SEO-A] JSON-LD 구조화 데이터 — 최우선

**파일:** `web-b2c/app/products/[slug]/page.tsx`

상품 상세 페이지에 `Product` 스키마 삽입:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "...",
  "image": "...",
  "description": "...",
  "brand": { "@type": "Brand", "name": "World Fan Gear" },
  "offers": {
    "@type": "Offer",
    "price": "12.99",
    "priceCurrency": "CAD",
    "availability": "https://schema.org/InStock",
    "url": "https://fifa2026.ca/products/[slug]"
  }
}
```

같은 배포에 함께 추가:
- 홈페이지: `WebSite` + `Organization` + `SearchAction` 스키마
- `/faq`: `FAQPage` 스키마 (리치결과 직접 노출)
- 상품 상세: `BreadcrumbList` 스키마 (현재 시각적 브레드크럼만 있음)

---

### [SEO-B] 메타 태그 패턴 개선

**파일:** `web-b2c/app/products/[slug]/page.tsx` — `generateMetadata()`

현재 → 개선 패턴:
```
// title
현재: "Canada 3D Embroidered Cap"
개선: "Canada World Cup 2026 Fan Cap | World Fan Gear"

// description (120자 이내 + 배송 CTA 포함)
현재: "Rep Canada all tournament long. An embroidered fan cap..."
개선: "Official Canada FIFA 2026 fan cap. 3D embroidered.
       Free shipping over $99. Ships from Toronto."
```

추가 누락 태그:
- `og:type: "product"` (현재 default "website")
- `og:url`: `https://fifa2026.ca/products/[slug]`
- `twitter:card: "summary_large_image"` (현재 아예 없음)
- 상품 목록에 `canonical` 태그 (필터/정렬 중복 콘텐츠 방지)
  ```ts
  alternates: { canonical: category ? `/products?category=${category}` : "/products" }
  ```

---

### [SEO-C] 상품명 / Slug 키워드 개편

**파일:** `web-b2c/lib/product-copy.ts` — `getB2CName()`
**주의:** Slug 변경 시 `next.config.ts`에 301 리다이렉트 추가 필수

개선 패턴: `[국가명] + World Cup 2026 + [카테고리]`

| 현재 slug | 개선 slug |
|-----------|-----------|
| `algeria-flag-souvenir-mini-boxing-glove` | `algeria-world-cup-2026-fan-boxing-gloves` |
| `canada-3d-embroidered-cap` | `canada-world-cup-2026-fan-cap` |
| `spain-car-flag` | `spain-fifa-2026-car-flag` |

---

### [SEO-D] 블로그 라우트 + 콘텐츠 캘린더 — 트래픽 최대 임팩트

**신규 라우트:** `web-b2c/app/blog/[slug]/page.tsx`
**구현 방식:** MDX 또는 static JSON (서버 컴포넌트)
**각 글 필수:** `Article` JSON-LD + 관련 상품 카드 3~4개 임베드 + `datePublished`

#### 이번 주 발행 (5/11~5/18) — 인덱싱 4주 확보
```
① "Canada World Cup 2026: Complete Fan Guide"
   → 브랜드 허브. 모든 카테고리/상품 내부 링크 모음

② "All 32 Teams in FIFA World Cup 2026: Fan Gear for Every Nation"
   → 국가명 32개 포함 롱폼. 검색 트래픽 넓게 캐치

③ "Best World Cup 2026 Gifts Under $50 (Ships from Canada)"
   → 구매 의도 높은 선물 검색 트래픽
```

#### 다음 주 발행 (5/18~5/25) — 인덱싱 3주 확보
```
④ "World Cup 2026 Host Cities: Fan Guide for Canadians"
   → 토론토/밴쿠버 지역 검색 캐치

⑤ "How to Throw a World Cup 2026 Watch Party: Gear Checklist"
   → "watch party" 검색 유입 → 상품 페이지 연결

⑥ "Canada vs [조별 상대국]: Fan Gear Showdown"
   → 조편성 확정 즉시 발행. 캐나다 조 검색 트래픽

⑦ "World Cup Car Flags: How to Pick the Right One for Your Car"
   → car flags 카테고리 롱테일 캐치
```

---

### [SEO-E] 카테고리 전용 랜딩 페이지

현재 `/products?category=Car+Flags` → Google이 낮게 평가하는 쿼리파라미터 URL.
독립 URL로 교체:

```
/collections/car-flags       → "World Cup 2026 Car Flags | All 32 Nations"
/collections/boxing-gloves   → "FIFA 2026 Fan Boxing Gloves | 50+ Countries"
/collections/caps            → "World Cup 2026 Caps | 3D Embroidered"
/collections/bucket-hats     → "World Cup 2026 Bucket Hats | Canada & All Nations"
```

각 페이지: 카테고리 설명 텍스트 200자+ + 상품 그리드 + `CollectionPage` JSON-LD

---

### [SEO-F] 국가별 허브 페이지

```
/teams/canada    → 최우선 (캐나다 본선 진출 역사적 이벤트 → 검색량 폭발)
/teams/morocco   → 모로코 팬 커뮤니티 토론토에 큰 편
/teams/argentina
/teams/brazil
/teams/usa       → 북미 개최국
/teams/mexico
```

---

### SEO 실행 우선순위 요약

| 주차 | 작업 | 임팩트 |
|------|------|--------|
| 이번 주 (5/11~5/18) | SEO-A (JSON-LD) + SEO-D 블로그 3편 + Search Console sitemap 제출 | 매우 높음 |
| 2주차 (5/18~5/25) | SEO-B (메타태그) + SEO-C (상품명) + SEO-E (카테고리 페이지) | 높음 |
| 3주차 (5/25~6/1) | SEO-D 블로그 4편 추가 + SEO-F (/teams/canada) | 높음 |
| 개막 전 (6/1~6/11) | sitemap 재정비 + B2B noindex + Search Console 인덱싱 재요청 | 중간 |

---

*Last updated: 2026-05-11 | SEO 상세 플랜 추가*
