# World Fan Gear — 풀스택 이커머스 플랫폼 기술 문서

> **도메인:** [fifa2026.ca](https://fifa2026.ca)  
> **작성일:** 2026년 5월  
> **스택:** Next.js 15 · Supabase (PostgreSQL) · Stripe · Shippo · Nodemailer · Vercel  

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [기술 스택 상세](#3-기술-스택-상세)
4. [모노레포 구조](#4-모노레포-구조)
5. [데이터베이스 스키마](#5-데이터베이스-스키마)
6. [B2C 쇼핑몰 (web-b2c)](#6-b2c-쇼핑몰-web-b2c)
7. [B2B 도매 포털 (web-b2b)](#7-b2b-도매-포털-web-b2b)
8. [Shippo 배송 통합](#8-shippo-배송-통합)
9. [Stripe 결제 통합](#9-stripe-결제-통합)
10. [이메일 시스템](#10-이메일-시스템)
11. [관리자 대시보드](#11-관리자-대시보드)
12. [환경 변수 및 배포](#12-환경-변수-및-배포)
13. [데이터베이스 마이그레이션 이력](#13-데이터베이스-마이그레이션-이력)
14. [구현 결정 사항 및 트레이드오프](#14-구현-결정-사항-및-트레이드오프)
15. [트러블슈팅 이력](#15-트러블슈팅-이력)

---

## 1. 프로젝트 개요

**World Fan Gear**는 FIFA 2026 월드컵을 겨냥한 캐나다 스포츠 팬 굿즈 이커머스 플랫폼이다. 단일 Supabase 인스턴스를 공유하는 **두 개의 독립 Next.js 애플리케이션**으로 구성된다.

| 앱 | 대상 고객 | 목적 |
|----|----------|------|
| `web-b2c` | 일반 소비자 | 온라인 소매 판매 (Stripe Checkout) |
| `web-b2b` | 도매 거래처 | 견적·주문·결제 링크 기반 B2B 거래 |

### 주요 판매 카테고리

- 복싱 글러브 (미니 소품용 6–8인치)
- 야구 캡 / 버킷 햇
- 차량용 국기 (Car Flags)
- 스티커 팩 (Panini FIFA World Cup 2026 공식)

### 운영 모델

- **배송**: 캐나다 전국 (Canada Post, UPS, FedEx, Purolator 등)
- **픽업**: 178 Bentworth Ave, North York, ON M6A 1P7 (무료)
- **세금**: 온타리오 HST 13% 자동 계산
- **통화**: CAD 단일 통화

---

## 2. 시스템 아키텍처

```
┌───────────────────────────────────────────────────────────────── ┐
│                         VERCEL (Edge)                            │
│                                                                  │
│   ┌─────────────────┐          ┌──────────────────────────┐      │
│   │   web-b2c       │          │   web-b2b                │      │
│   │  (fifa2026.ca)  │          │  (b2b.fifa2026.ca)       │      │
│   │                 │          │                          │      │
│   │  Next.js 15     │          │  Next.js 15              │      │
│   │  App Router     │          │  App Router              │      │
│   │  Server Actons  │          │  Server Actions          │      │
│   └────────┬────────┘          └──────────┬───────────────┘      │
│            │                               │                     │
└────────────┼───────────────────────────────┼─────────────────────┘
             │                               │
    ┌────────▼───────────────────────────────▼──────┐
    │           Supabase (PostgreSQL + Auth)        │
    │  - products, orders, order_items              │
    │  - profiles, quotes, customer_prices          │
    │  - Row Level Security policy                  │
    └───────────────────────────────────────────────┘
             │
    ┌────────▼────────────────────────────────────────────┐
    │                  External API                       │
    │  ┌──────────────┐  ┌──────────┐  ┌───────────────┐  │
    │  │ Stripe       │  │ Shippo   │  │ Gmail SMTP    │  │
    │  │ (pay)        │  │ (ship)   │  │ (email)       │  │
    │  └──────────────┘  └──────────┘  └───────────────┘  │
    └─────────────────────────────────────────────────────┘
```

### 데이터 흐름 — B2C 구매 프로세스

```
고객 → 장바구니 추가
     → 체크아웃 페이지 진입
     → 우편번호 입력 → /api/shipping-rates (Shippo API 호출)
     → 배송 업체 선택 (selectedRate.id 저장)
     → "Pay" 클릭 → /api/checkout (Stripe Session 생성)
     → Stripe Hosted Checkout 페이지로 리디렉트
     → 결제 완료 → /order-confirmation
     → Stripe Webhook → /api/stripe/webhook
          → Supabase orders 테이블 저장
          → 관리자 이메일 발송
          → 고객 주문 확인 이메일 발송
     → 관리자 대시보드 → Create Label 클릭
          → /api/admin/orders/[id]/create-label (Shippo transactions API)
          → PDF 라벨 URL + 트래킹 번호 저장
     → 배송 완료 → Send Tracking 클릭
          → /api/admin/orders/[id]/send-tracking
          → 고객에게 트래킹 이메일 발송
```

---

## 3. 기술 스택 상세

### 프론트엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 15 | 풀스택 React 프레임워크 (App Router) |
| React | 19 | UI 컴포넌트 |
| Tailwind CSS | 3 | 스타일링 |
| TypeScript | 5 | 타입 안정성 |

### 백엔드 / 인프라

| 기술 | 용도 |
|------|------|
| Supabase | PostgreSQL DB + Auth + Storage + Row Level Security |
| Vercel | 호스팅, Edge Functions, 환경 변수 관리 |
| Stripe | 결제 처리, Checkout Sessions, Webhooks |
| Shippo | 배송 요금 조회 (shipments API), 라벨 구매 (transactions API) |
| Nodemailer | 이메일 발송 (Gmail SMTP App Password 인증) |

### 인증 방식

- **B2C 관리자**: 쿠키 기반 패스워드 인증 (`lib/admin-auth.ts`)
- **B2B 사용자**: Supabase Auth (이메일/패스워드)
- **B2B 관리자**: Supabase profiles.role = 'admin' + RLS

---

## 4. 모노레포 구조

```
ecommerce-demo/
├── web-b2c/                    # B2C 쇼핑몰
│   ├── app/
│   │   ├── page.tsx            # 홈 (히어로 캐러셀, 트렌딩 상품)
│   │   ├── products/           # 상품 목록 · 상세
│   │   ├── cart/               # 장바구니
│   │   ├── checkout/           # 결제 폼 (배송/픽업 선택, Shippo 요율)
│   │   ├── order-confirmation/ # 결제 완료 페이지
│   │   ├── orders/[orderNumber]/ # 주문 조회
│   │   ├── collections/[slug]/ # 카테고리별 컬렉션
│   │   ├── teams/[slug]/       # 팀별 상품 필터
│   │   ├── blog/               # 블로그
│   │   ├── admin/              # 관리자 대시보드
│   │   │   ├── orders-dashboard.tsx  # 주문 관리 UI
│   │   │   └── products-dashboard.tsx # 상품 관리 UI
│   │   └── api/
│   │       ├── checkout/       # Stripe Session 생성
│   │       ├── shipping-rates/ # Shippo 요율 조회
│   │       ├── stripe/webhook/ # 결제 완료 처리
│   │       ├── verify-payment/ # 결제 상태 확인
│   │       ├── orders/[orderNumber]/ # 주문 조회
│   │       └── admin/
│   │           ├── orders/     # 주문 목록 (GET)
│   │           ├── orders/[id]/ # 주문 상세/수정 (GET/PATCH)
│   │           ├── orders/[id]/create-label/  # Shippo 라벨 구매
│   │           ├── orders/[id]/send-tracking/ # 트래킹 이메일 발송
│   │           ├── products/   # 상품 CRUD
│   │           ├── products/upload-image/     # 이미지 업로드
│   │           ├── products/[id]/ # 상품 수정/삭제
│   │           ├── seed-products/ # DB 초기 데이터 삽입
│   │           └── sync-stripe/   # Stripe 상품/가격 동기화
│   ├── components/
│   │   ├── layout/             # Header, Footer, AnnouncementBar
│   │   └── store/              # 상품카드, 장바구니, 히어로 캐러셀 등
│   └── lib/
│       ├── types.ts            # 공통 타입 정의
│       ├── products.ts         # 상품 조회 함수 (DB + static fallback)
│       ├── email.ts            # 이메일 템플릿 + 발송
│       ├── stripe.ts           # Stripe 클라이언트
│       ├── supabase.ts         # Supabase admin 클라이언트
│       ├── money.ts            # 통화 포맷, 세금 계산
│       ├── admin-auth.ts       # 관리자 쿠키 인증
│       └── checkout-status.ts  # 체크아웃 활성화 플래그
│
├── web-b2b/                    # B2B 포털
│   ├── app/
│   │   ├── page.tsx            # 도매 브라우저
│   │   ├── products/           # 상품 목록/상세
│   │   ├── cart/               # B2B 장바구니
│   │   ├── account/            # 고객 계정 (주문, 견적)
│   │   ├── login/register/     # 인증
│   │   └── admin/              # 관리자 (고객, 주문, 상품, 견적)
│   ├── components/
│   │   ├── admin/              # 관리자 UI (product-form 포함)
│   │   └── store/              # 도매 상품 브라우저
│   └── lib/
│       ├── types.ts            # B2B 타입
│       ├── pricing.ts          # 고객별 가격 계산
│       ├── stripe.ts           # Stripe Payment Link 생성
│       └── email.ts            # B2B 이메일
│
└── supabase/
    ├── migrations/
    │   ├── 001_b2b_schema.sql         # 기본 스키마 (profiles, products, orders...)
    │   ├── 002_add_shipping_fields.sql # 배송 필드 추가
    │   ├── 003_shipping_weights.sql   # 무게/박스 치수 데이터
    │   └── 004_order_label_fields.sql # Shippo 라벨 URL 필드
    └── seed/
        ├── seed.sql                   # 기본 상품 데이터
        └── boxing_gloves.sql          # 복싱 글러브 상품 데이터
```

---

## 5. 데이터베이스 스키마

Supabase 단일 인스턴스에 B2B와 B2C가 공존한다. B2C는 `orders`, `order_items`, `products` 테이블을 주로 사용하고, B2B는 `profiles`, `customer_prices`, `quotes` 등 추가 테이블을 사용한다.

### 5.1 products 테이블

```sql
CREATE TABLE public.products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  slug              text NOT NULL UNIQUE,
  description       text NOT NULL DEFAULT '',
  sku               text NOT NULL UNIQUE,
  category          text NOT NULL,
  base_price        numeric(12,2) NOT NULL,
  image_url         text,
  -- B2C 추가 필드
  status            text DEFAULT 'active',  -- 'active' | 'draft' | 'archived'
  price             numeric(12,2),
  compare_at_price  numeric(12,2),
  in_stock          boolean DEFAULT true,
  stock_qty         integer,
  badge             text,
  images            jsonb DEFAULT '[]',
  player_cards      jsonb,
  stripe_product_id text,
  stripe_price_id   text,
  -- 배송 관련 (migration 002, 003)
  weight_kg         numeric(12,4),
  box_length_cm     numeric(6,1),
  box_width_cm      numeric(6,1),
  box_height_cm     numeric(6,1),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

**무게 기준값 (카테고리별, 포장재 포함):**

| 카테고리 | 무게 (kg) | 기준 박스 (cm) | 근거 |
|---------|---------|-------------|------|
| Boxing Gloves | 0.30 | 22×14×10 | 미니 소품 6–8인치, 약 150–200g + 박스 |
| Caps | 0.25 | 22×20×14 | 스냅백 약 100g + 골판지 박스 150g |
| Bucket Hats | 0.20 | 26×20×6 | 접이식 약 100–150g + 폴리 마일러 |
| Car Flags | 0.12 | 32×16×5 | 폴리에스터 + 폴/클립 약 80–120g |
| Sticker Packs | 0.15 | 22×18×3 | 스티커 시트 + 골판지 마일러 |

**Panini 특수 상품:**

| 상품 | 무게 | 박스 (cm) |
|-----|------|---------|
| 스티커 박스 (50팩) | 0.45 kg | 22×16×10 |
| 스티커 앨범 | 0.35 kg | 24×18×3 |
| 번들 (앨범+박스) | 0.80 kg | 24×18×12 |

### 5.2 orders 테이블 (B2C)

```sql
CREATE TABLE public.orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        text NOT NULL,          -- WFG-{timestamp}-{random}
  stripe_session_id   text NOT NULL UNIQUE,   -- 중복 방지 키
  stripe_payment_intent text,
  channel             text DEFAULT 'b2c',
  delivery_method     text,                   -- 'shipping' | 'pickup'
  status              order_status,           -- paid/packing/shipped/...
  customer_email      text,
  customer_name       text,
  shipping_address    jsonb,                  -- { street, city, province, postal, country }
  subtotal            numeric(12,2),
  shipping_cost       numeric(12,2),
  tax_amount          numeric(12,2),
  total               numeric(12,2),
  carrier             text,                   -- 'Canada Post', 'UPS' 등
  tracking_number     text,
  tracking_url        text,
  shippo_rate_id      text,                   -- 고객이 선택한 Shippo rate object_id
  shippo_label_url    text,                   -- 관리자가 구매한 PDF 라벨 URL
  admin_note          text,
  created_at          timestamptz,
  updated_at          timestamptz
);
```

**주문 상태 흐름:**

```
paid → packing → shipped → completed
                         ↘ cancelled
                           refunded
pickup: paid → ready_for_pickup → completed
```

### 5.3 Row Level Security

B2B 테이블에는 RLS가 적용되어 있다. `is_admin()` 함수가 `profiles.role = 'admin'`인지 확인하고, 고객은 자신의 데이터만 접근 가능하다. B2C API 라우트는 `supabaseAdmin()` (service_role 키)을 사용하므로 RLS를 우회한다.

---

## 6. B2C 쇼핑몰 (web-b2c)

### 6.1 상품 데이터 구조

상품 데이터는 **이중 레이어**로 구성된다:

1. **Static fallback** (`lib/source-products.json` → `lib/products.ts`의 `staticProducts` 배열): DB 없이도 빌드/렌더링 가능. SSG의 `generateStaticParams`에서 사용.
2. **DB-backed** (Supabase `products` 테이블): 런타임에 `getAllProducts()`, `getProductBySlugFromDb()` 등 async 함수로 조회. DB 오류 시 자동으로 static fallback으로 전환.

```typescript
// lib/products.ts 핵심 패턴
export async function getAllProducts(): Promise<Product[]> {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "active");
    if (error || !data?.length) return staticProducts; // ← fallback
    return (data as DbProduct[]).map(dbProductToProduct);
  } catch {
    return staticProducts; // ← 네트워크 오류도 graceful 처리
  }
}
```

### 6.2 장바구니 (Cart)

`components/store/cart-provider.tsx`가 React Context로 전체 앱에 장바구니 상태를 제공한다. `localStorage`에 직렬화하여 새로고침 후에도 유지.

`CartItem` 타입에는 `weightKg` 필드가 포함되어 있어, 체크아웃 시 총 무게를 즉시 계산하여 Shippo API에 전달할 수 있다.

### 6.3 체크아웃 페이지 (`app/checkout/page.tsx`)

체크아웃은 단일 페이지 폼으로 구현되며, 다음 섹션으로 구성된다:

#### 배송 방법 선택
두 버튼 (Shipping / Pickup). Pickup 선택 시 주소 입력 필드와 Shippo 요율 조회가 비활성화된다.

#### 자동 Shippo 요율 조회
`useEffect`가 `form.postalCode`, `form.province`, `form.city`, `deliveryMethod`를 의존성으로 감시한다. 우편번호 6자리 완성 시 자동으로 `/api/shipping-rates`를 호출한다.

#### 배송비 표시 로직

주소 입력 전 "Free" 표시 문제를 방지하는 조건부 렌더링:

```tsx
{deliveryMethod === "pickup"
  ? "Free"
  : selectedRate
    ? formatCAD(selectedRate.amount)
    : fetchingRates
      ? "Calculating…"
      : form.postalCode.replace(/\s/g, "").length >= 6
        ? "—"
        : "Enter address"}
```

#### 세금 계산

온타리오 HST 13%. 픽업 시 ON 세율 고정, 배송 시 수령 주소 주/도 세율 적용.

#### Checkout 활성화 플래그

`lib/checkout-status.ts`의 `CHECKOUT_ENABLED = true/false`로 체크아웃을 즉시 켜고 끌 수 있다. `false`로 설정하면 페이지와 API 모두 비활성화.

#### Order ID 생성

```typescript
function generateOrderId(): string {
  return `WFG-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
// 예시: WFG-1747123456789-A3BX
```

Stripe metadata의 `order_id`로 전달되어 이메일과 Supabase 주문 번호로 사용된다.

---

## 7. B2B 도매 포털 (web-b2b)

### 7.1 인증 흐름

Supabase Auth 사용. 가입 시 `profiles` 테이블에 레코드 생성. `is_b2b_approved = false`인 신규 가입자는 관리자 승인 후 접근 가능.

### 7.2 가격 시스템

`customer_prices` 테이블로 고객별·수량별 가격을 관리한다. `lib/pricing.ts`의 `getEffectivePrice(customerId, productId, quantity)`가 해당 고객의 커스텀 가격을 조회하고, 없으면 `base_price`를 반환한다.

### 7.3 주문 처리 흐름

```
B2B 고객 → 장바구니 → Order Request Form 제출
                    → orders 테이블 'Pending Review' 상태로 저장
관리자 → 검토 → Approve
       → Stripe Payment Link 생성 (stripe.paymentLinks.create)
       → 고객에게 결제 링크 이메일 발송
고객 → 결제 완료 → Stripe Webhook → 주문 상태 'Paid'로 업데이트
관리자 → 발송 처리
```

### 7.4 상품 등록 폼 배송 섹션 (B2B 관리자)

`components/admin/product-form.tsx`에 eBay 방식의 **배송 섹션**이 추가되어 있다. 상품 등록 시 포장 포함 무게와 박스 치수를 입력:

```
┌─ Shipping ────────────────────────────────────────────────────┐
│ Input the real weight and the size of package                 │
│ Incorrect value might be the cause of additional shipping     │
│ fee charge                                                    │
│  Weight (kg): [____]                                          │
│  Box Dimensions (cm):  L: [__] × W: [__] × H: [__]            │
└───────────────────────────────────────────────────────────────┘
```

이 데이터는 `products.weight_kg`, `box_length_cm`, `box_width_cm`, `box_height_cm` 컬럼에 저장되며, B2C 체크아웃의 Shippo 요율 조회에 사용된다.

---

## 8. Shippo 배송 통합

### 8.1 사용 API

Shippo npm 패키지를 사용하지 않고 **직접 REST HTTP 호출**로 구현. fetch API만 사용하여 패키지 의존성 없음.

| 엔드포인트 | 용도 |
|-----------|------|
| `POST /shipments/` | 요율 조회 (고객 체크아웃 시) |
| `GET /carrier_accounts/?results=1` | 설정 확인 (헬스체크) |
| `POST /transactions/` | 라벨 구매 (관리자 액션) |

### 8.2 배송 요율 조회 (`/api/shipping-rates`)

#### 박스 동적 선택 알고리즘

총 주문 무게에 따라 표준 박스 4종 중 하나를 자동 선택한다:

```typescript
function selectBox(weightKg: number) {
  if (weightKg <= 0.30) return { length: "22", width: "18", height: "6" };  // Small
  if (weightKg <= 0.80) return { length: "32", width: "24", height: "12" }; // Medium
  if (weightKg <= 2.00) return { length: "42", width: "32", height: "16" }; // Large
  return { length: "50", width: "40", height: "22" };                       // XL
}
```

#### 용적 무게 계산

운송업체는 **실제 무게**와 **용적 무게** 중 큰 값으로 청구한다:

```typescript
// 캐나다포스트/UPS 기준: L×W×H(cm) ÷ 5000 = 용적 무게(kg)
const dimWeightKg = (L × W × H) / 5000;
const billableWeight = Math.max(actualWeightKg, dimWeightKg);
```

#### Shippo API 요청 구조

```json
{
  "address_from": {
    "name": "World Fan Gear",
    "street1": "178 Bentworth Ave",
    "city": "North York",
    "state": "ON",
    "zip": "M6A1P7",
    "country": "CA"
  },
  "address_to": {
    "city": "Toronto",
    "state": "ON",
    "zip": "M5V3L9",
    "country": "CA",
    "validate": false
  },
  "parcels": [{
    "length": "32", "width": "24", "height": "12",
    "distance_unit": "cm",
    "weight": "0.80",
    "mass_unit": "kg"
  }],
  "async": false
}
```

#### 결과 필터링 및 정렬

CAD 요율만 필터링하고 가격 오름차순으로 정렬하여 반환한다. `object_id`가 이후 라벨 구매 시 사용되는 `shippo_rate_id`다.

#### 폴백 처리

Shippo API 오류 또는 0개 요율 반환 시 `{ rates: [], fallback: true, debug: "..." }`를 HTTP 200으로 반환한다. 체크아웃 UI는 "Shipping unavailable — use Pickup" 메시지를 표시하고 픽업 전환을 유도한다.

### 8.3 캐리어 배지 UI

체크아웃 페이지에서 각 업체의 공식 브랜드 색상으로 배지를 표시한다:

| 업체 | 배경 | 글자색 |
|-----|-----|-------|
| Canada Post | #CC0000 | #fff |
| UPS | #351C15 | #FFB500 |
| FedEx | #4D148C | #FF6600 |
| Purolator | #003876 | #fff |
| DHL | #FFCC00 | #D40511 |

### 8.4 라벨 구매 (`/api/admin/orders/[id]/create-label`)

고객이 체크아웃 시 선택한 `shippo_rate_id`를 사용하여 관리자가 원클릭으로 실제 배송 라벨을 구매한다:

```typescript
// Shippo transactions API — 선택된 rate ID로 라벨 구매
POST https://api.goshippo.com/transactions/
{
  "rate": order.shippo_rate_id,
  "label_file_type": "PDF",
  "async": false
}

// 성공 시 orders 테이블 업데이트
await supabase.from("orders").update({
  shippo_label_url: transaction.label_url,     // PDF 다운로드 URL
  tracking_number: transaction.tracking_number,
  tracking_url: transaction.tracking_url_provider,
  carrier: transaction.provider,
  status: "packing",  // 자동 상태 전환
});
```

**중요**: 라벨 구매는 실제 비용을 발생시킨다. 한 번 구매한 라벨은 재구매 불가 (409 Conflict 반환).

### 8.5 Shippo Rate ID 전체 흐름

```
체크아웃 페이지
  └─ selectedRate.id (Shippo object_id)
       ↓
/api/checkout (Stripe Session 생성)
  └─ session.metadata.shippo_rate_id = selectedRate.id
       ↓
Stripe Webhook (결제 완료)
  └─ orders.shippo_rate_id = meta.shippo_rate_id
       ↓
/api/admin/orders/[id]/create-label
  └─ rate: order.shippo_rate_id → Shippo transactions API
       ↓
orders.shippo_label_url, tracking_number, tracking_url 저장
```

---

## 9. Stripe 결제 통합

### 9.1 결제 모드

**Stripe Hosted Checkout** (embedded Stripe.js 미사용). 서버에서 Session을 생성하고 고객을 Stripe 페이지로 리디렉트한다. 카드 정보가 자사 서버를 거치지 않으므로 PCI 준수에 유리.

### 9.2 Checkout Session 생성 (`/api/checkout`)

```typescript
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  customer_email: customerEmail,
  line_items: [
    // 상품 라인 (Stripe Price ID 우선, 없으면 price_data로 생성)
    { quantity: 2, price: "price_xxx" },
    // 배송비 라인
    { quantity: 1, price_data: { currency: "cad", unit_amount: 1500,
        product_data: { name: "Shipping" } } },
    // 세금 라인 (HST 13%)
    { quantity: 1, price_data: { currency: "cad", unit_amount: 650,
        product_data: { name: "Tax (HST 13%)" } } },
  ],
  success_url: `${base}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${base}/checkout`,
  metadata: {
    order_id: "WFG-1747123456789-A3BX",
    delivery_method: "shipping",
    shippo_rate_id: "xxxxxxxxxxxx",
    carrier: "CANADA_POST",
    shipping_name: "John Doe",
    shipping_address: "123 Main St",
    shipping_city: "Toronto",
    shipping_province: "ON",
    shipping_postal: "M5V3L9",
    shipping_country: "Canada",
  },
});
```

**배송 정보를 metadata에 포함**하여 webhook에서 재사용 가능하게 한다.

### 9.3 Webhook 처리 (`/api/stripe/webhook`)

처리하는 이벤트:

| 이벤트 | 처리 내용 |
|-------|---------|
| `checkout.session.completed` | 주문 저장, 이메일 발송 |
| `checkout.session.expired` | 로그 기록 |
| `charge.refunded` | 주문 상태 → `refunded` |

`checkout.session.completed` 처리 순서:
1. Stripe 서명 검증 (`webhooks.constructEvent`)
2. `listLineItems`로 구매 항목 조회
3. **이메일 병렬 발송** (관리자 + 고객) — DB 저장과 독립 실행
4. Supabase `orders` upsert (`onConflict: "stripe_session_id"` — 멱등성 보장)
5. `order_items` 삽입 (기존 항목 삭제 후 재삽입으로 멱등성 보장)

### 9.4 Stripe 키 관리

| 환경 | STRIPE_SECRET_KEY | 동작 |
|------|-------------------|------|
| 로컬 (`.env.local`) | `sk_test_...` | 테스트 카드 (`4242 4242 4242 4242`) 사용 |
| Vercel 프로덕션 | `sk_live_...` | 실제 카드만 사용 |

두 환경의 키는 반드시 쌍이 맞아야 한다 (test↔test, live↔live). Stripe Hosted Checkout을 사용하므로 프론트엔드에 publishable key는 필요하지 않다.

### 9.5 Stripe 상품 동기화

`/api/admin/sync-stripe` 엔드포인트가 Supabase `products` 테이블의 상품을 Stripe에 동기화하여 `stripe_product_id`와 `stripe_price_id`를 저장한다. 이 ID가 있으면 체크아웃에서 Stripe Price 객체를 직접 참조하고, 없으면 `price_data`로 즉석 생성한다.

---

## 10. 이메일 시스템

### 10.1 설정

Gmail SMTP + **App Password** 인증 (2단계 인증 활성화 필요):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jameskimkim1@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx    # Google 계정 → 보안 → 앱 비밀번호
```

Nodemailer가 포트 587 STARTTLS로 연결한다 (`secure: false`).

### 10.2 발송 이메일 종류

| 이메일 | 트리거 | 수신자 |
|-------|-------|-------|
| **주문 완료 알림** | Stripe webhook | 관리자 |
| **주문 확인** | Stripe webhook | 고객 |
| **배송 추적 정보** | 관리자 "Send Tracking" 버튼 | 고객 |
| **픽업 준비 완료** | 관리자 상태 → ready_for_pickup | 고객 |

### 10.3 이메일 템플릿 구성

모든 이메일은 인라인 스타일 HTML로 작성되어 있다 (이메일 클라이언트 호환성).  
World Fan Gear 브랜드 색상 `#C41E3A` (빨간색) 사용.

**관리자 주문 알림** 포함 내용:
- 주문 ID, 고객 이메일, 배송지 주소
- 주문 아이템 테이블 (상품명, 수량, 금액)
- 총 금액
- Stripe 대시보드 링크 버튼

**고객 주문 확인** 포함 내용:
- 고객 이름으로 퍼스널라이제이션 ("Hi John, thanks for your order!")
- 주문 아이템 (배송비/세금 별도 표시)
- 소계/배송비/세금/합계
- 배송지 주소
- "Continue Shopping" CTA 버튼

**배송 추적 이메일** 포함 내용:
- 운송 업체명, 트래킹 번호
- "Track Your Package →" 버튼 (파란색 `#1a6fcc`)
- 주문 아이템 요약

**픽업 준비 이메일** 포함 내용:
- 픽업 주소: 178 Bentworth Ave, North York, ON M6A 1P7
- 영업 시간: Mon–Sat 9AM–7PM / Sun 11AM–4PM
- 주문 아이템 요약
- 헤더 색상 초록색 `#16a34a` (배송 이메일과 시각적 구분)

### 10.4 SMTP 미설정 시 Graceful 처리

```typescript
function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}
// 미설정 시 경고 로그만 출력, 오류 발생 없음 — 주문 처리는 계속 진행
```

---

## 11. 관리자 대시보드

### 11.1 인증

`lib/admin-auth.ts`가 HTTP-only 쿠키로 관리자 세션을 관리한다. 모든 `/api/admin/*` 라우트는 `verifyAdminCookie()` 호출로 시작한다.

### 11.2 주문 대시보드 (`app/admin/orders-dashboard.tsx`)

#### 탭 필터
`all` / `paid` (신규) / `packing` / `shipped` / `ready_for_pickup` / `completed` / `cancelled` / `refunded` / `issues`

#### 검색 및 필터
- 텍스트 검색: 주문 번호, 고객 이름/이메일, 트래킹 번호
- 배송 방법 필터: 전체 / 배송 / 픽업

#### 상태별 색상 코딩

| 상태 | 배경색 |
|-----|--------|
| paid (신규) | 흰색 |
| packing | 황색 (`amber-50`) |
| shipped | 노란색 (`yellow-50`) |
| ready_for_pickup | 노란색 |
| completed | 초록색 (`green-50`) |
| cancelled / refunded | 회색 (`gray-100`) |

#### 사이드 패널 (주문 상세)
주문 클릭 시 우측에 슬라이드인. 포함 내용:
1. 주문 정보 (번호, 날짜, 채널, 배송 방법)
2. 고객 (이름, 이메일)
3. 배송지 전체 주소
4. 아이템 목록 (수량, 단가)
5. 금액 (소계/배송비/세금/합계)
6. 상태 변경 드롭다운
7. 트래킹 (업체, 번호, URL 입력)
8. **Shipping Label 섹션**:
   - `Create Label` 버튼 (`shippo_rate_id` 있을 때 활성화)
   - 구매 후 `Print / Download Label (PDF)` 링크
   - `Track Package` 링크
9. `Send Tracking Email` 버튼
10. 관리자 내부 메모

### 11.3 상품 대시보드 (`app/admin/products-dashboard.tsx`)

- Supabase에서 전체 상품 로드
- 상품 카드 그리드 (이미지, 이름, 가격, 재고 상태, 배지)
- 상품 등록/수정 (이미지 업로드, Stripe 동기화)
- 상품 숨김 처리

### 11.4 API 라우트 요약 (Admin)

| 메서드 | 경로 | 기능 |
|-------|------|------|
| GET | `/api/admin/orders` | 최근 50개 주문 목록 |
| GET | `/api/admin/orders/[id]` | 주문 상세 + 아이템 |
| PATCH | `/api/admin/orders/[id]` | 상태/트래킹/메모 수정 |
| POST | `/api/admin/orders/[id]/create-label` | Shippo 라벨 구매 |
| POST | `/api/admin/orders/[id]/send-tracking` | 트래킹 이메일 발송 |
| GET | `/api/admin/products` | 상품 목록 |
| POST | `/api/admin/products` | 상품 등록 |
| PUT | `/api/admin/products/[id]` | 상품 수정 |
| DELETE | `/api/admin/products/[id]` | 상품 삭제 |
| POST | `/api/admin/products/upload-image` | 이미지 업로드 |
| POST | `/api/admin/seed-products` | 초기 데이터 삽입 |
| POST | `/api/admin/sync-stripe` | Stripe 상품 동기화 |

---

## 12. 환경 변수 및 배포

### 12.1 필수 환경 변수 (`web-b2c`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://zgztvepfolbztbweoxcl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...    # 서버에서만 사용, 절대 공개 금지

# Stripe
STRIPE_SECRET_KEY=sk_live_...                 # 로컬: sk_test_..., Vercel 프로덕션: sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 이메일
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jameskimkim1@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx               # Google App Password (공개 금지)
EMAIL_FROM=World Fan Gear <jameskimkim1@gmail.com>
ADMIN_EMAIL=jameskimkim1@gmail.com

# 배송 (Shippo)
SHIPPO_API_KEY=shippo_live_...

# 발신 주소 (Shippo address_from 사용)
STORE_NAME=World Fan Gear
STORE_STREET=178 Bentworth Ave
STORE_CITY=North York
STORE_PROVINCE=ON
STORE_POSTAL=M6A1P7                          # 공백 없는 형식 필수 (Shippo 20자 제한)

# 사이트
NEXT_PUBLIC_SITE_URL=https://fifa2026.ca
ADMIN_PASSWORD=...
```

### 12.2 배포 (Vercel)

```bash
# 프로덕션 배포 (web-b2c 디렉토리에서 실행)
cd web-b2c && npx vercel --prod

# 환경 변수 관리
npx vercel env ls                           # 목록 확인
npx vercel env add KEY production           # 추가
npx vercel env rm KEY production            # 삭제
npx vercel env pull .env.production --environment production  # 로컬로 내려받기
```

### 12.3 DB 마이그레이션

```bash
npx supabase db push    # supabase/migrations/ 폴더 내 파일을 Supabase에 적용
```

### 12.4 Stripe Webhook 설정

Stripe 대시보드 → Developers → Webhooks에서 프로덕션 엔드포인트 등록:
```
https://fifa2026.ca/api/stripe/webhook
```

구독 이벤트:
- `checkout.session.completed`
- `checkout.session.expired`
- `charge.refunded`

---

## 13. 데이터베이스 마이그레이션 이력

### 001_b2b_schema.sql — B2B 기본 스키마

B2B 포털의 전체 DB 구조 생성:
- 커스텀 ENUM 타입: `user_role`, `order_status`, `payment_status`, `availability_status`, `delivery_method`, `quote_status`
- 테이블: `profiles`, `products`, `customer_prices`, `orders`, `order_items`, `quotes`, `quote_items`, `invoices`
- `is_admin()` 보안 함수 (security definer)
- 전 테이블 RLS 활성화 및 세분화된 접근 정책 적용

### 002_add_shipping_fields.sql — 배송 필드 추가

```sql
ALTER TABLE public.products ADD COLUMN weight numeric(12,4), weight_unit text, ...;
ALTER TABLE public.orders ADD COLUMN shippo_rate_id text, carrier_name text, ...;
```

### 003_shipping_weights.sql — 무게 및 박스 치수 데이터

- `box_length_cm`, `box_width_cm`, `box_height_cm` 컬럼 추가
- 카테고리별 `weight_kg` 업데이트 (eBay/Amazon/Canada Post 가이드 기반 리서치값)
- 카테고리별 기본 박스 치수 설정
- Panini 스티커 상품 특수 처리 (`slug LIKE '%sticker-box%'` 패턴 매칭)

### 004_order_label_fields.sql — Shippo 라벨 URL 필드

```sql
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shippo_label_url TEXT,
  ADD COLUMN IF NOT EXISTS shippo_rate_id   TEXT;
```

`IF NOT EXISTS`로 멱등성 보장 (002에서 이미 추가된 `shippo_rate_id` 충돌 방지).

---

## 14. 구현 결정 사항 및 트레이드오프

### Shippo npm 패키지 대신 직접 HTTP 호출

**선택**: `node-shippo` 패키지 미사용, `fetch()` 직접 호출  
**이유**: 사용하는 엔드포인트가 2개뿐이고, 직접 호출이 더 투명하고 TypeScript 타입을 직접 제어 가능.

### Stripe Hosted Checkout vs 임베디드

**선택**: Stripe Hosted Checkout (외부 페이지 리디렉트)  
**이유**: PCI 준수 간소화, 카드 정보가 자사 서버를 거치지 않음. 단점은 브랜딩 제어 제한.

### Static fallback 상품 데이터 유지

**선택**: DB 없이도 동작하는 static 데이터 유지  
**이유**: SSG `generateStaticParams`가 빌드 시 DB 연결 없이 슬러그를 생성해야 함. DB 장애 시에도 쇼핑몰이 정상 표시됨.

### 세금을 Stripe line item으로 처리

**선택**: 세금을 별도 line item ("Tax (HST 13%)")으로 추가  
**이유**: Stripe Tax 기능 미사용. 캐나다 HST 13% 고정이므로 서버에서 직접 계산. Webhook에서 description으로 필터링하여 세금 금액 복원.

### Webhook 이메일 발송 격리

**선택**: 이메일 발송 성공 여부와 무관하게 Supabase 저장은 반드시 수행  
**이유**: 이메일 오류가 주문 저장을 막아서는 안 됨. 이메일 try-catch를 독립적으로 감싸서 webhook 200 응답에 영향 없음.

### B2C와 B2B의 Supabase 공유

**선택**: 단일 Supabase 인스턴스 공유  
**이유**: `orders.channel` 컬럼(`b2c` / `b2b`)으로 구분. B2C는 service_role로 RLS 우회, B2B는 Supabase Auth + RLS 사용.

### 우편번호만으로 배송 요율 조회

**선택**: 전체 주소 없이 우편번호 + 주/도 + 도시만으로 Shippo 요율 조회  
**이유**: 고객이 주소를 다 입력하기 전에 배송 업체 선택지를 보여주면 전환율에 유리. Shippo `validate: false` 옵션 활용.

---

## 15. 트러블슈팅 이력

### STORE_POSTAL "too long" 오류

**증상**: Shippo API가 `"zip":["Ensure this value has at most 20 characters (it has 24)."]` 오류 반환  
**원인**: Vercel의 `STORE_POSTAL` 환경 변수에 전체 주소가 들어있었음  
**해결**: Vercel에서 `STORE_POSTAL`을 `M6A1P7` (공백 없음, 6자)로 재설정. 코드에도 `.replace(/\s/g, "")` 방어 처리 추가.

### B2B 파일 롤백

**증상**: Gemini AI가 B2B 배송 코드를 잘못 수정하여 빌드 오류 발생  
**해결**: `git checkout 9af99a4 -- web-b2b/app/actions.ts web-b2b/components/admin/product-form.tsx`로 특정 커밋 상태 복원. 그 위에 배송 무게/치수 필드만 새로 추가.

### "Free" 배송 표시 오류

**증상**: 배송 선택 시 주소 입력 전에 배송비가 "Free"로 표시됨  
**원인**: 배송비 계산식이 `shipping = selectedRate?.amount ?? 0`을 사용하여 미선택(null) 상태를 $0 (무료)로 오해  
**해결**: `selectedRate`가 null일 때와 pickup일 때를 명시적으로 구분하는 조건부 렌더링 적용.

### Vercel 배포 경로 오류

**증상**: `npx vercel --prod` 실행 시 경로 오류  
**원인**: 프로젝트 루트(`ecommerce-demo/`)가 아닌 `web-b2c/` 서브디렉토리에서 실행해야 함  
**해결**: `cd web-b2c && npx vercel --prod` 순서로 실행.

---

*이 문서는 2026년 5월 기준 구현 상태를 반영한다.*  
*World Fan Gear 풀스택 이커머스 플랫폼 — B2C 쇼핑몰 + B2B 도매 포털 + Shippo 배송 자동화 + Gmail SMTP 이메일 알림 통합 완료.*
