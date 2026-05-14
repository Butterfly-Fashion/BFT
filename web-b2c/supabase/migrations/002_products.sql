-- Products table
-- Run in Supabase SQL Editor (both test and production DBs)
-- Requires update_updated_at() function from 001_orders.sql

CREATE TABLE IF NOT EXISTS products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  slug              text UNIQUE NOT NULL,
  category          text NOT NULL,
  description       text,
  price             numeric(10,2) NOT NULL,
  compare_at_price  numeric(10,2),
  weight_kg         numeric(6,3) NOT NULL DEFAULT 0.5,
  badge             text,
  in_stock          boolean NOT NULL DEFAULT true,
  stock_qty         integer,
  status            text NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'draft', 'archived')),
  images            jsonb NOT NULL DEFAULT '[]',
  player_cards      jsonb,
  stripe_product_id text,
  stripe_price_id   text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_products_status   ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug     ON products(slug);
