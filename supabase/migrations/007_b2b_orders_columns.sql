-- 007_b2b_orders_columns.sql
-- B2B 주문 기능에 필요한 컬럼을 기존 B2C orders/order_items 테이블에 추가
-- B2C 데이터는 영향 없음 (ADD COLUMN IF NOT EXISTS + nullable)
-- Applied: 2026-05-29 via Supabase Management API

-- ── orders: B2B 전용 컬럼 추가 ────────────────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'Unpaid';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_fee numeric(12,2) DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS total_amount numeric(12,2) DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_notes text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS admin_notes text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_payment_link text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- ── orders: B2C 전용 NOT NULL 제약 완화 ───────────────────────────────────
-- B2C orders have order_number/stripe_session_id. B2B orders don't use these.
ALTER TABLE public.orders ALTER COLUMN order_number DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN stripe_session_id DROP NOT NULL;
-- B2B uses different status/delivery_method values → drop B2C-only check constraints
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_delivery_method_check;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
-- Make delivery_method and status optional at DB level (validated at app level)
ALTER TABLE public.orders ALTER COLUMN delivery_method DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN status DROP NOT NULL;

-- ── order_items: B2B 전용 컬럼 추가 ──────────────────────────────────────
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_name_snapshot text;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS sku_snapshot text;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS unit_price_snapshot numeric(12,2);

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS line_total numeric(12,2);

-- ── order_items: B2C 전용 NOT NULL 제약 완화 ──────────────────────────────
-- B2C items use name/unit_price. B2B uses product_name_snapshot/unit_price_snapshot.
ALTER TABLE public.order_items ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.order_items ALTER COLUMN unit_price DROP NOT NULL;
