-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

CREATE TABLE IF NOT EXISTS orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number          text UNIQUE NOT NULL,
  stripe_session_id     text UNIQUE NOT NULL,
  stripe_payment_intent text,
  channel               text DEFAULT 'b2c',
  delivery_method       text CHECK (delivery_method IN ('shipping', 'pickup')),
  status                text NOT NULL DEFAULT 'paid'
                        CHECK (status IN (
                          'paid', 'packing', 'shipped',
                          'ready_for_pickup', 'completed',
                          'cancelled', 'refunded'
                        )),
  customer_email        text,
  customer_name         text,
  shipping_address      jsonb,
  subtotal              numeric(10,2),
  shipping_cost         numeric(10,2),
  tax_amount            numeric(10,2),
  total                 numeric(10,2),
  carrier               text,
  tracking_number       text,
  tracking_url          text,
  admin_note            text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name        text NOT NULL,
  slug        text,
  size        text,
  quantity    integer NOT NULL DEFAULT 1,
  unit_price  numeric(10,2) NOT NULL,
  image_url   text
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for common queries
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_customer_email_idx ON orders(customer_email);
