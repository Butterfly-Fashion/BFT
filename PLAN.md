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

## 실행 순서

```
S-1 (이미지 갤러리) → S-2 (Trust Badges) → S-3 (검색) → S-4 (홈 섹션) → S-5 (체크아웃 스텝) → S-6 (정렬 필터) → S-7 (도메인 이전)
```

*Last updated: 2026-05-08 | 현재 작업: S-1 (상품 이미지 갤러리)*
