# Butterfly 경량 커머스 운영 시스템 — 상세 개발 기획서

**비전**: World Fan Gear의 모든 판매 채널(B2C 웹사이트, B2B 도매, POS 대면판매, eBay/Amazon)을 하나의 통합 백엔드로 운영하는 "Butterfly" 시스템 구축

---

## 1. 시스템 핵심 원칙

| 원칙 | 내용 |
|------|------|
| 채널 통합 | B2C / B2B / POS / 오픈마켓은 '입구'만 다를 뿐, 동일한 Order·Product·Inventory 테이블을 공유 |
| B2B 워크플로우 보존 | "주문 요청 → 관리자 검토 → 승인 → 결제 링크" 흐름은 B2B 핵심이므로 유지 |
| SKU 중심 설계 | SKU를 재고·판매·회계 시스템의 연결 키로 사용 |
| 점진적 구축 | 80%의 운영 효율을 달성하는 핵심 20% 기능을 단계별 구현 |

---

## 2. 전체 데이터베이스 스키마 (Supabase / PostgreSQL)

### 2-A. 상품 테이블 (`products`)

```sql
CREATE TABLE products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku             text UNIQUE NOT NULL,          -- 모든 시스템의 연결 키
  slug            text UNIQUE NOT NULL,          -- URL 슬러그
  name            text NOT NULL,
  description     text,
  price_b2c       numeric(10,2) NOT NULL,        -- B2C 소비자가
  price_b2b       numeric(10,2),                 -- B2B 도매가 (NULL이면 B2B 미노출)
  category        text,
  image_url       text,
  placeholder_gradient text,
  weight_kg       numeric(6,3) DEFAULT 0.5,      -- Shippo 배송비 계산용
  sizes           text[],                        -- 사이즈 옵션 (없으면 NULL)
  in_stock        boolean DEFAULT true,
  visible_b2c     boolean DEFAULT true,          -- B2C 노출 여부
  visible_b2b     boolean DEFAULT false,         -- B2B 노출 여부
  visible_pos     boolean DEFAULT true,          -- POS 노출 여부
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
```

### 2-B. 재고 테이블 (`inventory`)

```sql
CREATE TABLE inventory (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid REFERENCES products(id) ON DELETE CASCADE,
  sku             text NOT NULL,
  stock_quantity  integer NOT NULL DEFAULT 0,    -- 현재 실제 재고
  reserved_stock  integer NOT NULL DEFAULT 0,   -- 결제 중 예약된 수량
  low_stock_alert integer DEFAULT 5,            -- 이 수량 이하 시 알림
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(sku)
);

-- 재고 변동 이력 (감사 로그)
CREATE TABLE inventory_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku         text NOT NULL,
  delta       integer NOT NULL,                  -- 양수=입고, 음수=출고
  reason      text CHECK (reason IN (
                'sale', 'restock', 'manual_adjustment',
                'reserved', 'reserve_released', 'return'
              )),
  order_id    uuid,                              -- 연관 주문 (있을 경우)
  note        text,
  created_by  uuid,                             -- 처리한 직원/시스템
  created_at  timestamptz DEFAULT now()
);
```

### 2-C. 고객 테이블 (`customers`)

```sql
CREATE TABLE customers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text UNIQUE NOT NULL,
  first_name      text,
  last_name       text,
  phone           text,
  customer_type   text DEFAULT 'b2c' CHECK (customer_type IN ('b2c', 'b2b', 'pos')),
  company_name    text,                          -- B2B 전용
  tax_exempt      boolean DEFAULT false,         -- B2B 세금 면제 여부
  quickbooks_id   text,                          -- QuickBooks 고객 ID
  stripe_customer_id text,
  created_at      timestamptz DEFAULT now()
);
```

### 2-D. 주문 테이블 (`orders`)

```sql
CREATE TABLE orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    text UNIQUE NOT NULL,          -- 사람이 읽기 쉬운 번호 (WFG-2026-0001)
  channel         text CHECK (channel IN ('b2c', 'b2b', 'pos', 'ebay', 'amazon')),
  delivery_method text CHECK (delivery_method IN ('shipping', 'pickup')),
  status          text CHECK (status IN (
                    'pending_review',            -- B2B: 관리자 검토 대기
                    'approved',                  -- B2B: 승인됨
                    'awaiting_payment',          -- 결제 링크 발송됨
                    'paid',                      -- 결제 완료
                    'processing',                -- 포장/출고 준비
                    'shipped',                   -- 발송됨
                    'delivered',                 -- 배달 완료
                    'cancelled',                 -- 취소
                    'refunded'                   -- 환불
                  )) DEFAULT 'pending_review',
  customer_id     uuid REFERENCES customers(id),
  subtotal        numeric(10,2) NOT NULL,
  shipping_cost   numeric(10,2) DEFAULT 0,
  tax_amount      numeric(10,2) DEFAULT 0,
  total           numeric(10,2) NOT NULL,
  currency        text DEFAULT 'CAD',
  shipping_address jsonb,                        -- {street, city, province, postal, country}
  stripe_session_id text,
  stripe_payment_intent_id text,
  quickbooks_invoice_id text,
  tracking_number text,
  carrier         text,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 주문 상세 항목
CREATE TABLE order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid REFERENCES orders(id) ON DELETE CASCADE,
  sku         text NOT NULL,
  product_id  uuid REFERENCES products(id),
  name        text NOT NULL,
  size        text,
  quantity    integer NOT NULL,
  unit_price  numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL
);
```

### 2-E. B2B 주문 요청 테이블 (`b2b_quote_requests`)

```sql
CREATE TABLE b2b_quote_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid REFERENCES orders(id),
  company_name    text,
  contact_name    text NOT NULL,
  email           text NOT NULL,
  phone           text,
  items           jsonb NOT NULL,                -- [{sku, name, qty, note}]
  message         text,
  status          text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  admin_note      text,
  payment_link    text,                          -- Stripe 결제 링크
  created_at      timestamptz DEFAULT now()
);
```

---

## 3. 8단계 개발 로드맵 (Phase Roadmap)

### Phase 1: 현재 B2C MVP 안정화 ✅ (완료 / 진행 중)

**목표**: 현재 운영 중인 B2C 사이트를 안정화하고, 향후 통합의 기반을 마련

**완료된 작업**:
- [x] Stripe Checkout 연동 (결제)
- [x] 제품 카탈로그 (products.ts)
- [x] 장바구니 (cart-provider)
- [x] 관리자 대시보드 (Stripe 주문 조회)
- [x] Google Analytics 4 (GA4) 전자상거래 이벤트
- [x] Pickup / Shipping 배송 옵션 분리
- [x] Shippo API 연동 (실시간 배송비 조회)
- [x] 지역별 배송비 티어 (PROVINCE_SHIPPING_RATES)
- [x] HeroCarousel
- [x] 무료배송 배너 기능 플래그 (SHOW_FREE_SHIPPING_BANNER)

**남은 작업**:
- [ ] Supabase DB 스키마 확정 및 마이그레이션 실행
- [ ] Supabase Auth로 관리자 로그인 보호
- [ ] Stripe Webhook 강화 (결제 완료 시 DB 주문 생성)
- [ ] Shippo 실시간 요율 디버깅 (현재 fallback 발생)

**Shippo 디버깅 체크리스트**:
1. Vercel 환경변수 확인: `SHIPPO_API_KEY`, `STORE_STREET`, `STORE_POSTAL` 설정 여부
2. `https://fifa2026.ca/api/shipping-rates` (GET) 접속 → `configured: true` 확인
3. 실제 배송지 주소로 `STORE_STREET`, `STORE_POSTAL` 업데이트 필요

---

### Phase 2: 통합 관리자 대시보드 구축

**목표**: 직원이 모든 운영(상품, 주문, 고객, 재고)을 한 곳에서 처리

**주요 기능**:

#### 2-1. 주문 관리 고도화
```
/admin/orders
├── 전체 주문 목록 (필터: 채널, 상태, 날짜)
├── 주문 상세 보기 (고객 정보, 상품, 결제 내역)
├── 상태 변경 (processing → shipped → delivered)
├── 운송장 번호 입력
└── 환불 처리 (Stripe Refund API 연동)
```

#### 2-2. 상품 관리
```
/admin/products
├── 상품 목록 (CRUD)
├── 이미지 업로드 (Supabase Storage)
├── 채널별 노출 설정 (visible_b2c, visible_b2b, visible_pos)
└── 재고 수량 표시 및 수정
```

#### 2-3. 고객 관리
```
/admin/customers
├── 고객 목록 (B2C / B2B 구분)
├── 고객별 주문 이력
└── B2B 고객: 도매가 설정, 세금 면제 여부
```

#### 2-4. B2B 주문 요청 처리
```
/admin/b2b-requests
├── 요청 목록 (pending → reviewed → approved)
├── 요청 상세 (상품, 수량, 고객 메시지)
├── 결제 링크 생성/복사 (Stripe Payment Link API)
└── 이메일 발송 (결제 링크 안내)
```

**API 설계**:
```
GET  /api/admin/orders?status=paid&channel=b2c
GET  /api/admin/orders/:id
PUT  /api/admin/orders/:id/status
POST /api/admin/orders/:id/refund
GET  /api/admin/products
POST /api/admin/products
PUT  /api/admin/products/:id
GET  /api/admin/customers
POST /api/admin/b2b-requests/:id/approve  -- Stripe Payment Link 생성
```

---

### Phase 3: 실시간 재고 관리 (Inventory)

**목표**: 수동 확인에서 실제 수량 기반 자동 관리로 전환

**주요 기능**:

#### 3-1. 재고 현황 대시보드
```
/admin/inventory
├── SKU별 현재 재고 / 예약 재고 / 가용 재고
├── 재고 부족 알림 (low_stock_alert 이하 시 빨간 표시)
├── 재고 수동 조정 (입고, 분실, 폐기)
└── 재고 변동 이력 (inventory_logs)
```

#### 3-2. 자동 재고 차감 로직
```typescript
// Stripe Webhook: checkout.session.completed
async function handlePaymentSuccess(session: Stripe.CheckoutSession) {
  const items = JSON.parse(session.metadata.items);
  
  for (const item of items) {
    // 1. 재고 차감
    await supabase.rpc('decrement_stock', {
      p_sku: item.sku,
      p_quantity: item.quantity,
    });
    
    // 2. 재고 로그 기록
    await supabase.from('inventory_logs').insert({
      sku: item.sku,
      delta: -item.quantity,
      reason: 'sale',
      order_id: session.metadata.order_id,
    });
  }
}
```

#### 3-3. 재고 예약 (Race Condition 방지)
```sql
-- 결제 시작 시 재고 예약 (Stripe Checkout 세션 생성 시점)
CREATE OR REPLACE FUNCTION reserve_stock(p_sku text, p_quantity integer)
RETURNS boolean AS $$
BEGIN
  UPDATE inventory
  SET reserved_stock = reserved_stock + p_quantity
  WHERE sku = p_sku
    AND (stock_quantity - reserved_stock) >= p_quantity;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
```

---

### Phase 4: QuickBooks 회계 연동

**목표**: 주문 완료 시 QuickBooks에 자동으로 판매 기록 생성

**주요 기능**:

#### 4-1. QuickBooks OAuth 연동
```
/admin/settings/quickbooks
├── QB 연결 상태 표시
├── OAuth 2.0 인증 흐름
└── 토큰 갱신 자동화
```

#### 4-2. 자동 동기화 엔진
```typescript
// 주문 완료 → QB 판매 영수증/인보이스 자동 생성
async function syncToQuickBooks(order: Order) {
  // 1. 고객 조회 또는 생성
  const customer = await qb.findOrCreateCustomer({
    email: order.customer.email,
    name: `${order.customer.firstName} ${order.customer.lastName}`,
  });
  
  // 2. B2C: Sales Receipt 생성
  if (order.channel === 'b2c') {
    await qb.createSalesReceipt({
      customerId: customer.Id,
      lines: order.items.map(item => ({
        sku: item.sku,
        qty: item.quantity,
        unitPrice: item.unitPrice,
      })),
      shippingAmount: order.shippingCost,
      taxAmount: order.taxAmount,
    });
  }
  
  // 3. B2B: Invoice 생성
  if (order.channel === 'b2b') {
    await qb.createInvoice({ ... });
  }
}
```

#### 4-3. 동기화 센터 (Sync Center)
```
/admin/quickbooks/sync
├── 동기화 이력 (성공 / 실패)
├── 실패 건 재시도 버튼
├── 수동 동기화 트리거
└── QB 연결 끊김 알림
```

---

### Phase 5: B2C 자동 결제 사이트 고도화

**목표**: 고객 경험 개선 및 결제 전환율 향상

**주요 기능**:
- [ ] 이메일 영수증 자동 발송 (Resend or SendGrid)
- [ ] 주문 상태 추적 페이지 (`/orders/:id?email=...`)
- [ ] 프로모션 코드/쿠폰 (Stripe Coupon API)
- [ ] 제품 리뷰 시스템 (Supabase)
- [ ] 관련 상품 추천 (같은 카테고리 기반)
- [ ] PWA 지원 (오프라인 장바구니 유지)

---

### Phase 6: B2B 포털 고도화

**목표**: 도매 고객이 직접 로그인하여 주문 요청 가능한 포털

**주요 기능**:

#### 6-1. B2B 로그인 시스템
```
/b2b/login          -- 도매 고객 전용 로그인
/b2b/register       -- 가입 신청 (관리자 승인 필요)
/b2b/dashboard      -- 주문 이력, 견적 요청, 인보이스
```

#### 6-2. 고객별 도매가 설정
```typescript
// 고객 등급별 가격
type PriceTier = 'retail' | 'wholesale_10' | 'wholesale_20' | 'custom';

// 상품별 도매가
const wholesalePrice = product.price_b2b ?? product.price_b2c * 0.8;
```

#### 6-3. 견적 요청 (RFQ) 고도화
- 수량별 자동 할인율 표시
- 견적 PDF 다운로드
- 이메일 자동 발송 (견적 → 결제 링크)

---

### Phase 7: POS-lite (웹 기반 포스)

**목표**: 매장/창고 대면 판매를 위한 태블릿 최적화 POS

**UI 레이아웃**:
```
┌─────────────────────────────────────────────┐
│  [바코드 스캔 / SKU 검색]                    │
├─────────────────┬───────────────────────────┤
│                 │  장바구니                   │
│  상품 그리드    │  ─────────────────────────│
│  (터치 최적화)  │  Jordan 23 Jersey  x2     │
│                 │  CA Flag            x1     │
│                 │  ─────────────────────────│
│                 │  소계: $89.97              │
│                 │  HST (13%): $11.70         │
│                 │  합계: $101.67             │
│                 │                            │
│                 │  [현금]  [카드]  [이체]    │
└─────────────────┴───────────────────────────┘
```

**주요 기능**:
- SKU/바코드 스캔 → 즉시 장바구니 추가
- 결제 수단: Stripe Terminal (카드), 현금, E-transfer
- 결제 완료 → 재고 자동 차감 + QuickBooks 동기화
- 영수증 출력 또는 이메일 발송

---

### Phase 8: 마켓플레이스 동기화 (eBay / Amazon)

**목표**: 외부 채널 주문을 통합 시스템으로 임포트

**주요 기능**:
- eBay Trading API / Amazon SP-API 연동
- SKU 매핑 테이블 (eBay ItemID ↔ 내부 SKU)
- 주문 자동 임포트 (30분 간격 cron)
- 재고 통합 차감
- 채널별 수수료 QuickBooks 처리

---

## 4. 기술 스택 및 인프라

### 4-1. 모노레포 구조 (Turborepo)

```
ecommerce-demo/
├── apps/
│   ├── web-b2c/          -- Next.js 14 (현재)
│   ├── web-b2b/          -- Next.js 14 (Phase 6)
│   └── web-admin/        -- Next.js 14 (Phase 2, 현재 /admin 분리)
├── packages/
│   ├── ui/               -- 공유 컴포넌트 (Button, Card, Badge...)
│   ├── types/            -- 공유 TypeScript 타입 (Product, Order, Customer...)
│   └── utils/            -- 공유 로직 (money.ts, tax.ts, provinces.ts)
├── supabase/
│   ├── migrations/       -- DB 마이그레이션 파일
│   └── seed.sql          -- 초기 데이터
└── turbo.json
```

### 4-2. CI/CD 파이프라인

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    steps:
      - run: pnpm lint          # ESLint
      - run: pnpm type-check    # tsc --noEmit
      - run: pnpm test          # Vitest (단위 테스트)
      - run: pnpm test:e2e      # Playwright (결제 플로우)
```

### 4-3. 보안 (Supabase RLS)

```sql
-- 관리자만 주문 수정 가능
CREATE POLICY "admin_only_update_orders" ON orders
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- 고객은 자신의 주문만 조회 가능
CREATE POLICY "customers_own_orders" ON orders
  FOR SELECT USING (
    customer_id = (SELECT id FROM customers WHERE email = auth.email())
  );

-- 재고 로그는 읽기 전용 (삭제/수정 불가)
CREATE POLICY "inventory_logs_immutable" ON inventory_logs
  FOR DELETE USING (false);
```

### 4-4. 환경변수 관리

```bash
# Vercel 환경변수 (Production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SHIPPO_API_KEY=shippo_live_...
STORE_NAME=World Fan Gear
STORE_STREET=<실제 주소>
STORE_CITY=Toronto
STORE_PROVINCE=ON
STORE_POSTAL=<실제 우편번호>
QUICKBOOKS_CLIENT_ID=...
QUICKBOOKS_CLIENT_SECRET=...
RESEND_API_KEY=re_...
```

---

## 5. 우선순위 매트릭스

| Phase | 기능 | 비즈니스 임팩트 | 개발 난이도 | 예상 기간 |
|-------|------|----------------|------------|----------|
| 1 | MVP 안정화 (Shippo 디버깅, Webhook) | 높음 | 낮음 | 1주 |
| 2 | 통합 Admin 대시보드 | 높음 | 중간 | 2주 |
| 3 | 재고 관리 | 높음 | 중간 | 2주 |
| 4 | QuickBooks 연동 | 중간 | 높음 | 3주 |
| 5 | B2C 고도화 (이메일, 추적) | 중간 | 낮음 | 1주 |
| 6 | B2B 포털 | 중간 | 높음 | 3주 |
| 7 | POS-lite | 낮음 | 높음 | 3주 |
| 8 | 마켓플레이스 | 낮음 | 높음 | 4주 |

**총 예상 기간**: 약 19주 (약 5개월, 순차 개발 기준)

---

## 6. 즉시 실행 가능한 다음 단계 (Phase 1 마무리)

### Step 1: Shippo 디버깅
1. `https://fifa2026.ca/api/shipping-rates` (GET) → `configured: true` 확인
2. Vercel 환경변수에서 실제 매장 주소로 `STORE_STREET`, `STORE_POSTAL` 업데이트
3. 체크아웃에서 실제 우편번호 입력 후 빨간 debug 메시지 확인

### Step 2: Supabase DB 세팅
```bash
# 마이그레이션 실행
supabase db push
```

### Step 3: Stripe Webhook → DB 주문 저장
```typescript
// /api/webhooks/stripe/route.ts
// checkout.session.completed → orders 테이블에 INSERT
```

### Step 4: 관리자 인증 적용
```typescript
// Supabase Auth로 /admin/** 보호
// middleware.ts에서 세션 확인
```

---

## 7. 결론

Butterfly 시스템은 **운영 효율의 80%를 해결하는 핵심 20% 기능**을 우선순위에 따라 순차 구현합니다. 현재 Phase 1(B2C MVP)의 핵심 기능은 대부분 완성된 상태이며, Phase 2(Admin 고도화)와 Phase 3(재고 관리)가 가장 즉각적인 운영 효율 향상을 가져올 수 있습니다. QuickBooks 연동(Phase 4)은 회계 자동화의 핵심으로, 이 세 단계가 완성되면 World Fan Gear의 일상 운영 대부분을 자동화할 수 있습니다.
