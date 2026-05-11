# SEO 완전 가이드 — World Fan Gear (fifa2026.ca)

> 이 문서는 이 사이트에 적용된 모든 SEO 구현 내용과,
> 앞으로 해야 할 작업, Search Console 등록 방법을 A부터 Z까지 정리한 레퍼런스입니다.
>
> **마감 카운트다운:** 월드컵 개막 2026-06-11

---

## 목차

1. [현재 구현 완료된 것](#1-현재-구현-완료된-것)
2. [파일별 SEO 역할 지도](#2-파일별-seo-역할-지도)
3. [구조화 데이터 (JSON-LD) 전체 목록](#3-구조화-데이터-json-ld-전체-목록)
4. [메타 태그 패턴](#4-메타-태그-패턴)
5. [URL 구조 / 사이트맵](#5-url-구조--사이트맵)
6. [robots.txt](#6-robotstxt)
7. [블로그 시스템](#7-블로그-시스템)
8. [컬렉션 / 팀 랜딩 페이지](#8-컬렉션--팀-랜딩-페이지)
9. [성능 SEO](#9-성능-seo)
10. [Google Search Console 등록 방법](#10-google-search-console-등록-방법)
11. [남은 작업 (TODO)](#11-남은-작업-todo)
12. [키워드 전략](#12-키워드-전략)
13. [모니터링 체크리스트](#13-모니터링-체크리스트)

---

## 1. 현재 구현 완료된 것

### ✅ 기술 SEO (Technical SEO)

| 항목 | 상태 | 파일 |
|------|------|------|
| `metadataBase` 설정 | ✅ | `app/layout.tsx` |
| Title 템플릿 (`%s \| World Fan Gear`) | ✅ | `app/layout.tsx` |
| 사이트 전체 기본 description | ✅ | `app/layout.tsx` |
| OpenGraph 기본 설정 (og:image 포함) | ✅ | `app/layout.tsx` |
| Twitter Card 기본 설정 | ✅ | `app/layout.tsx` |
| `lang="en-CA"` | ✅ | `app/layout.tsx` |
| Inter 폰트 `display: swap` | ✅ | `app/layout.tsx` |
| Canonical URL (전 페이지) | ✅ | 각 page.tsx |
| sitemap.xml 자동 생성 | ✅ | `app/sitemap.ts` |
| robots.txt | ✅ | `public/robots.txt` |
| 보안 헤더 (HSTS 등) | ✅ | `next.config.ts` |
| 이미지 최적화 (Next/Image) | ✅ | 전 상품/블로그 페이지 |

### ✅ 구조화 데이터 (JSON-LD)

| 스키마 타입 | 적용 위치 | 효과 |
|------------|----------|------|
| `Organization` | 전 페이지 (layout) | 브랜드 인식, Knowledge Panel |
| `WebSite` + `SearchAction` | 전 페이지 (layout) | Google Sitelinks 검색창 |
| `Product` + `Offer` | 상품 상세 페이지 | Google 쇼핑 탭, 가격 리치결과 |
| `BreadcrumbList` | 상품 상세, 블로그 글 | 검색결과 경로 표시 |
| `BlogPosting` | 블로그 글 | 뉴스/기사 리치결과 |
| `FAQPage` | 블로그 글 (각 글 하단 FAQ) | 검색결과 FAQ 직접 노출 |

### ✅ 콘텐츠 SEO

| 항목 | 상태 |
|------|------|
| 블로그 글 10편 | ✅ |
| 카테고리 랜딩 페이지 5개 (`/collections/*`) | ✅ |
| 국가별 팀 페이지 9개 (`/teams/*`) | ✅ |
| 상품 상세 페이지 (200개+) 개별 메타 | ✅ |
| 상품 설명 B2C 감성화 (`product-copy.ts`) | ✅ |
| Vercel Analytics + Speed Insights | ✅ |

---

## 2. 파일별 SEO 역할 지도

```
web-b2c/
│
├── app/
│   ├── layout.tsx              ← 사이트 전체 기본 메타태그 + Organization/WebSite JSON-LD
│   ├── page.tsx                ← 홈페이지
│   ├── sitemap.ts              ← sitemap.xml 자동 생성 (전 URL 포함)
│   ├── not-found.tsx           ← 커스텀 404
│   │
│   ├── products/
│   │   ├── page.tsx            ← 상품 목록 (canonical 포함)
│   │   └── [slug]/
│   │       └── page.tsx        ← 상품 상세 (Product JSON-LD, BreadcrumbList, Twitter Card)
│   │
│   ├── blog/
│   │   ├── page.tsx            ← 블로그 목록 (canonical, OG)
│   │   └── [slug]/
│   │       └── page.tsx        ← 블로그 글 (BlogPosting + FAQPage + BreadcrumbList JSON-LD)
│   │
│   ├── collections/
│   │   └── [slug]/
│   │       └── page.tsx        ← 카테고리 랜딩 페이지
│   │
│   ├── teams/
│   │   └── [slug]/
│   │       └── page.tsx        ← 국가별 팀 랜딩 페이지
│   │
│   ├── faq/page.tsx            ← FAQ 페이지
│   ├── shipping/page.tsx       ← 배송 정책
│   ├── returns/page.tsx        ← 반품 정책
│   └── contact/page.tsx        ← 연락처
│
├── lib/
│   ├── seo.ts                  ← SEO 헬퍼 함수 전체 (핵심 파일)
│   ├── seo-pages.ts            ← 컬렉션/팀 페이지 데이터 정의
│   ├── blog-posts.ts           ← 블로그 글 10편 전체 데이터
│   └── product-copy.ts         ← 상품명/설명 B2C 패턴 함수
│
└── public/
    └── robots.txt              ← 크롤러 지시문 + sitemap URL
```

---

## 3. 구조화 데이터 (JSON-LD) 전체 목록

### 3-1. Organization (전 페이지)

**위치:** `app/layout.tsx` → `lib/seo.ts > organizationJsonLd()`

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "World Fan Gear",
  "url": "https://fifa2026.ca",
  "logo": "https://fifa2026.ca/asset/logo.jpg",
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "support@fifa2026.ca",
    "contactType": "customer support",
    "areaServed": "CA"
  }
}
```

**효과:** Google Knowledge Panel, 브랜드 검색 시 정보 표시

---

### 3-2. WebSite + SearchAction (전 페이지)

**위치:** `app/layout.tsx` → `lib/seo.ts > websiteJsonLd()`

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "World Fan Gear",
  "url": "https://fifa2026.ca",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://fifa2026.ca/products?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

**효과:** Google Sitelinks 검색창 (브랜드 검색 시 검색창 직접 노출)

---

### 3-3. Product + Offer (상품 상세 페이지)

**위치:** `app/products/[slug]/page.tsx` → `lib/seo.ts > productJsonLd()`

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Canada World Cup 2026 Fan Cap",
  "image": ["https://..."],
  "description": "Shop Canada World Cup 2026 Fan Cap from World Fan Gear...",
  "brand": { "@type": "Brand", "name": "World Fan Gear" },
  "sku": "canada-black-flag-3d-embroidered-cap",
  "category": "Caps",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "CAD",
    "price": "19.99",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": { "@type": "Organization", "name": "World Fan Gear" }
  }
}
```

**효과:** Google 쇼핑 탭 노출, 검색결과에 가격/재고 직접 표시

---

### 3-4. BreadcrumbList (상품 상세, 블로그 글)

**위치:** `lib/seo.ts > breadcrumbJsonLd()`

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://fifa2026.ca" },
    { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://fifa2026.ca/products" },
    { "@type": "ListItem", "position": 3, "name": "Canada Fan Cap", "item": "https://fifa2026.ca/products/canada-black-flag-3d-embroidered-cap" }
  ]
}
```

**효과:** 검색결과 URL 아래 경로 표시 (`Home > Products > Canada Fan Cap`)

---

### 3-5. BlogPosting (블로그 글 상세)

**위치:** `app/blog/[slug]/page.tsx`

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Canada World Cup 2026: Complete Fan Guide",
  "description": "...",
  "image": ["https://..."],
  "datePublished": "2026-05-12",
  "dateModified": "2026-05-12",
  "author": { "@type": "Organization", "name": "World Fan Gear" },
  "publisher": {
    "@type": "Organization",
    "name": "World Fan Gear",
    "logo": { "@type": "ImageObject", "url": "https://fifa2026.ca/asset/logo.jpg" }
  }
}
```

**효과:** Google 뉴스/기사 인식, 발행일 표시

---

### 3-6. FAQPage (블로그 글 하단 FAQ)

**위치:** `app/blog/[slug]/page.tsx`

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "When should I buy World Cup 2026 fan gear in Canada?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Buying early is usually better because popular country styles can sell out..."
      }
    }
  ]
}
```

**효과:** 검색결과 아래 FAQ 직접 펼침 표시 (클릭 없이 답변 노출)

---

## 4. 메타 태그 패턴

### 사이트 전체 기본값 (`layout.tsx`)

```
title:       "World Fan Gear | Canada 2026"
template:    "%s | World Fan Gear"
description: "Canada 2026-inspired soccer fan merchandise..."
og:image:    /asset/hero-banner.jpg (1717×916)
og:locale:   en_CA
twitter:card: summary_large_image
lang:        en-CA
```

### 상품 상세 페이지 패턴

**함수 위치:** `lib/seo.ts > productSeoTitle()`, `productSeoDescription()`

```
title:       "[상품명] | Canada 2026 Fan Gear"
description: "Shop [상품명] from World Fan Gear. Canada 2026-inspired soccer fan
              merchandise shipping from Toronto, with free shipping over $99 CAD."
canonical:   /products/[slug]
og:type:     website
og:image:    상품 이미지 URL
twitter:card: summary_large_image
```

### 블로그 글 패턴

```
title:       "[글 제목] | World Fan Gear"
description: [post.description]
canonical:   /blog/[slug]
og:type:     article
og:publishedTime: [publishedAt]
og:image:    [post.heroImage]
twitter:card: summary_large_image
robots:      미발행 글은 noindex
```

### 컬렉션/팀 페이지 패턴

```
title:       "[컬렉션명] | World Fan Gear"
description: [collectionPage.description]
canonical:   /collections/[slug] 또는 /teams/[slug]
```

---

## 5. URL 구조 / 사이트맵

### 사이트맵 커버리지

**파일:** `app/sitemap.ts`
**URL:** `https://fifa2026.ca/sitemap.xml`

| URL 그룹 | 개수 | priority | changeFrequency |
|----------|------|----------|-----------------|
| 홈 | 1 | 1.0 | daily |
| 상품 목록 `/products` | 1 | 0.9 | daily |
| 블로그 목록 `/blog` | 1 | 0.8 | daily |
| 컬렉션 `/collections/*` | 5 | 0.8 | weekly |
| 팀 페이지 `/teams/*` | 9 | 0.8 | weekly |
| 블로그 글 `/blog/*` | 10 | 0.75 | monthly |
| 상품 상세 `/products/*` | 200+ | 0.7 | weekly |
| 정책 페이지 | 4 | 0.4 | monthly |

**총 URL:** 약 230+개

### 전체 URL 목록

```
/                                     ← 홈
/products                             ← 전체 상품
/products/[slug]                      ← 상품 상세 (200+개)

/collections/world-cup-caps           ← 캡 모음
/collections/world-cup-bucket-hats    ← 버킷햇 모음
/collections/world-cup-car-flags      ← 카 플래그 모음
/collections/souvenir-boxing-gloves   ← 소형 권투 글러브 모음
/collections/canada-2026-fan-gear     ← 캐나다 팬 기어 모음

/teams/canada                         ← 캐나다 팬 기어
/teams/argentina                      ← 아르헨티나 팬 기어
/teams/brazil                         ← 브라질 팬 기어
/teams/france                         ← 프랑스 팬 기어
/teams/germany                        ← 독일 팬 기어
/teams/mexico                         ← 멕시코 팬 기어
/teams/portugal                       ← 포르투갈 팬 기어
/teams/spain                          ← 스페인 팬 기어
/teams/usa                            ← 미국 팬 기어

/blog                                 ← 블로그 목록
/blog/world-cup-2026-fan-gear-canada
/blog/canada-world-cup-2026-party-ideas
/blog/world-cup-car-flags-canada
/blog/best-soccer-gifts-canada
/blog/world-cup-2026-host-cities-canada
/blog/how-to-decorate-car-world-cup
/blog/match-day-outfit-ideas-world-cup
/blog/canada-soccer-fan-merchandise
/blog/world-cup-bucket-hats
/blog/world-cup-souvenirs-canada

/faq
/shipping
/returns
/contact
```

---

## 6. robots.txt

**파일:** `public/robots.txt`

```
User-agent: *
Allow: /

Disallow: /api/
Disallow: /cart
Disallow: /checkout
Disallow: /order-confirmation

Sitemap: https://fifa2026.ca/sitemap.xml
```

**차단 이유:**
- `/api/` — API 엔드포인트, 크롤 필요 없음
- `/cart` — 개인화 페이지, 중복 콘텐츠 방지
- `/checkout` — 결제 플로우, 인덱싱 불필요
- `/order-confirmation` — 주문 완료 페이지, 동적 콘텐츠

---

## 7. 블로그 시스템

### 구조

```
lib/blog-posts.ts     ← 글 데이터 전체 (제목/설명/섹션/FAQ/연결 상품)
app/blog/page.tsx     ← 목록 페이지
app/blog/[slug]/page.tsx  ← 상세 페이지 (JSON-LD 3종 포함)
```

### BlogPost 인터페이스

```ts
interface BlogPost {
  slug: string;          // URL 경로
  title: string;         // H1 + meta title
  description: string;   // meta description
  publishedAt: string;   // "YYYY-MM-DD" — sitemap lastModified에도 사용
  updatedAt?: string;    // 수정일 (없으면 publishedAt 사용)
  category: string;      // 표시용 카테고리 라벨
  heroImage: string;     // OG 이미지 + 히어로 이미지
  heroAlt: string;       // 이미지 alt 텍스트
  productSlugs: string[]; // 연결할 상품 slug 목록 (최대 4개 표시)
  sections: BlogSection[]; // 본문 섹션 배열
  faqs: Array<{ q: string; a: string }>; // FAQPage JSON-LD로 변환됨
}
```

### 글 10편 목록

| slug | 카테고리 | 발행일 |
|------|---------|--------|
| `world-cup-2026-fan-gear-canada` | Fan Gear Guide | 2026-05-11 |
| `canada-world-cup-2026-party-ideas` | Watch Parties | 2026-05-11 |
| `world-cup-car-flags-canada` | Car Flags | 2026-05-12 |
| `best-soccer-gifts-canada` | Gift Guide | 2026-05-12 |
| `world-cup-2026-host-cities-canada` | Tournament Guide | 2026-05-13 |
| `how-to-decorate-car-world-cup` | Car Flags | 2026-05-13 |
| `match-day-outfit-ideas-world-cup` | Style Guide | 2026-05-14 |
| `canada-soccer-fan-merchandise` | Canada Fan Gear | 2026-05-14 |
| `world-cup-bucket-hats` | Bucket Hats | 2026-05-15 |
| `world-cup-souvenirs-canada` | Souvenirs | 2026-05-15 |

### 글 추가하는 방법

`lib/blog-posts.ts`의 `blogPosts` 배열에 객체 하나 추가하면 됩니다.
배포 후 자동으로 `/blog/[slug]` URL 생성, sitemap에 포함, JSON-LD 적용됩니다.

```ts
// 새 글 추가 예시
{
  slug: "canada-vs-argentina-fan-gear",
  title: "Canada vs Argentina: Fan Gear for Both Sides",
  description: "...",
  publishedAt: "2026-05-20",
  category: "Match Preview",
  heroImage: "/asset/hero-banner.jpg",
  heroAlt: "Canada and Argentina fan gear for World Cup 2026",
  productSlugs: ["canada-car-flag", "argentina-car-flag"],
  sections: [
    { heading: "...", body: ["...", "..."] }
  ],
  faqs: [
    { q: "...", a: "..." }
  ],
}
```

---

## 8. 컬렉션 / 팀 랜딩 페이지

### 목적

`/products?category=Caps` 같은 쿼리 파라미터 URL은 Google이 낮게 평가합니다.
독립 URL을 만들어 카테고리/국가별로 SEO 트래픽을 잡습니다.

### 컬렉션 페이지 5개 (`/collections/[slug]`)

**파일:** `lib/seo-pages.ts > collectionPages`

| URL | 타깃 키워드 |
|-----|-----------|
| `/collections/world-cup-caps` | "World Cup 2026 caps Canada" |
| `/collections/world-cup-bucket-hats` | "World Cup 2026 bucket hats" |
| `/collections/world-cup-car-flags` | "World Cup 2026 car flags Canada" |
| `/collections/souvenir-boxing-gloves` | "mini boxing gloves souvenirs" |
| `/collections/canada-2026-fan-gear` | "Canada 2026 fan gear" |

### 팀 페이지 9개 (`/teams/[slug]`)

**파일:** `lib/seo-pages.ts > teamPages`

| URL | 타깃 키워드 |
|-----|-----------|
| `/teams/canada` | "Canada World Cup 2026 fan gear" ← 최우선 |
| `/teams/argentina` | "Argentina 2026 fan gear Canada" |
| `/teams/brazil` | "Brazil World Cup fan gear" |
| `/teams/france` | "France 2026 fan gear" |
| `/teams/germany` | "Germany World Cup 2026" |
| `/teams/mexico` | "Mexico World Cup fan gear Canada" |
| `/teams/portugal` | "Portugal 2026 fan gear" |
| `/teams/spain` | "Spain World Cup 2026 fan gear" |
| `/teams/usa` | "USA World Cup 2026 fan gear" |

---

## 9. 성능 SEO

성능 점수(Core Web Vitals)는 Google 검색 랭킹 직접 요소입니다.

| 최적화 항목 | 구현 방법 |
|-----------|---------|
| 폰트 로딩 | Inter: `display: swap` 적용 |
| 이미지 최적화 | `next/image` 전면 사용 (WebP 자동 변환, lazy load) |
| 이미지 사이즈 힌트 | `sizes` prop 명시 (블로그 히어로, 상품 그리드) |
| 상품 상세 이미지 | `priority` prop으로 LCP 최적화 |
| 정적 생성 | 상품/블로그 페이지 `generateStaticParams` 적용 |
| 보안 헤더 | `next.config.ts`에서 HSTS, CSP 헤더 설정 |
| Vercel Speed Insights | 실사용자 CWV 데이터 수집 중 |
| Vercel Analytics | 페이지별 트래픽 파악 |

---

## 10. Google Search Console 등록 방법

### Step 1 — Search Console 접속 및 속성 추가

```
1. https://search.google.com/search-console 접속
2. "속성 추가" 클릭
3. "URL 접두어" 선택
4. https://fifa2026.ca 입력 → 계속
```

### Step 2 — 소유권 인증 (HTML 태그 방식 권장)

Google이 발급하는 코드를 복사한 후 `web-b2c/app/layout.tsx`에 추가:

```ts
// app/layout.tsx
export const metadata: Metadata = {
  // ... 기존 내용 ...
  verification: {
    google: "여기에_Google이_발급한_코드_붙여넣기",
    // 예: google: "abc123def456ghi789"
  },
};
```

저장 → `git push` → Vercel 자동 배포 (1~2분) → Search Console에서 "확인" 클릭

### Step 3 — Sitemap 제출

```
Search Console 좌측 메뉴 → Sitemaps
→ "새 사이트맵 추가" 입력창에: sitemap.xml
→ 제출
```

URL: `https://fifa2026.ca/sitemap.xml`

### Step 4 — URL 검사 (중요 페이지 즉시 인덱싱 요청)

```
Search Console 상단 검색창에 URL 입력
→ "색인 생성 요청" 클릭
```

우선순위 순서로 요청:
```
1. https://fifa2026.ca
2. https://fifa2026.ca/products
3. https://fifa2026.ca/blog
4. https://fifa2026.ca/teams/canada
5. https://fifa2026.ca/collections/canada-2026-fan-gear
6. https://fifa2026.ca/blog/world-cup-2026-fan-gear-canada
7. https://fifa2026.ca/blog/canada-world-cup-2026-party-ideas
```

> Search Console 색인 요청은 하루에 10개 한도가 있음.
> 가장 중요한 URL부터 순서대로 요청할 것.

### Step 5 — 기다리기

| 페이지 유형 | 일반적인 인덱싱 소요 시간 |
|-----------|----------------------|
| 홈/주요 페이지 | 1~3일 |
| 블로그 글 | 3~7일 |
| 상품 상세 (200+) | 1~4주 (sitemap 크롤링 순서) |

---

## 11. 남은 작업 (TODO)

### 🔴 급함 (이번 주)

- [ ] **Search Console 소유권 인증** — `layout.tsx`에 `verification.google` 추가
- [ ] **Sitemap 제출** — Search Console에서 `sitemap.xml` 제출
- [ ] **주요 URL 색인 요청** — 홈, 블로그, /teams/canada 등 7개
- [ ] **블로그 히어로 이미지** — `/blog/world-cup-2026-fan-gear-canada` 등 일부 글이 `/asset/hero-banner.jpg` 공유 중 → 글별 고유 이미지 추가 권장

### 🟡 중요 (2주 안에)

- [ ] **`/faq` 페이지 FAQPage JSON-LD** — `/blog` 글에는 있지만 `/faq` 라우트 자체에는 없음
- [ ] **상품 페이지 `og:type: "product"`** — 현재 `"website"`로 설정, `"product"`로 변경하면 소셜 공유 시 가격 표시 가능
- [ ] **팀/컬렉션 페이지 추가** — 현재 9개 팀. 모로코, 일본, 한국, 세네갈 등 추가 가능
- [ ] **sitemap `lastModified` 정적 라우트** — 현재 `new Date()`로 매번 변경. 실제 날짜로 고정

### 🟢 나중에

- [ ] **`/admin` noindex** — 현재 B2B 어드민이 Google에 노출될 수 있음
- [ ] **프랑스어 버전 (`/fr`)** — 퀘벡 시장 (880만 명). `hreflang` 태그 필요
- [ ] **Google Merchant Center 연동** — Product JSON-LD를 Google 쇼핑 광고와 연결
- [ ] **이미지 alt 텍스트 고도화** — 현재 상품명만 사용. `"Canada 2026 World Cup Car Flag - World Fan Gear"` 형태로 통일

---

## 12. 키워드 전략

### Tier 1 — 메인 타깃 (사이트 전체)

```
World Cup 2026 fan gear Canada
FIFA 2026 merchandise Canada
Canada 2026 soccer fan gear
World Cup 2026 Canada shop
```

### Tier 2 — 카테고리별

```
World Cup 2026 car flags Canada
World Cup 2026 caps soccer fan
Canada 2026 bucket hat
mini boxing gloves souvenir soccer
```

### Tier 3 — 롱테일 (상품 상세)

```
Canada World Cup 2026 car flag buy
Argentina fan gear Canada 2026
Brazil soccer cap World Cup
Morocco World Cup 2026 boxing gloves
```

### Tier 4 — 블로그 타깃 (정보성)

```
how to decorate car World Cup 2026
World Cup 2026 watch party ideas Canada
best soccer gifts under $50 Canada
World Cup bucket hat outdoor
```

---

## 13. 모니터링 체크리스트

### 주 1회

- [ ] Search Console → "Coverage" 탭 — 색인 오류 없는지 확인
- [ ] Search Console → "Performance" 탭 — 클릭수/노출수 증가 추세 확인
- [ ] Vercel Analytics — 트래픽 급증 페이지 확인

### 월드컵 개막 전 (6월 초)

- [ ] 전체 블로그 10편 색인 완료 여부 확인
- [ ] `/teams/canada` 색인 확인
- [ ] `site:fifa2026.ca` 구글 검색으로 인덱싱된 페이지 수 확인

### 도구

| 도구 | 용도 | URL |
|------|------|-----|
| Google Search Console | 인덱싱, 검색 성능 | search.google.com/search-console |
| Vercel Analytics | 트래픽, 방문자 | vercel.com/dashboard |
| Vercel Speed Insights | Core Web Vitals | vercel.com/dashboard |
| Rich Results Test | JSON-LD 검증 | search.google.com/test/rich-results |
| Open Graph Debugger | OG 태그 미리보기 | developers.facebook.com/tools/debug |
| Twitter Card Validator | Twitter Card 미리보기 | cards-dev.twitter.com/validator |

---

*Last updated: 2026-05-11*
*Maintainer: World Fan Gear dev*
