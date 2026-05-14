-- Orders + order_items tables
-- Run in Supabase SQL Editor (both test and production DBs)

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number          text NOT NULL,
  stripe_session_id     text UNIQUE NOT NULL,
  stripe_payment_intent text,
  channel               text NOT NULL DEFAULT 'b2c',
  delivery_method       text CHECK (delivery_method IN ('shipping', 'pickup')),
  status                text NOT NULL DEFAULT 'paid'
                          CHECK (status IN ('paid','packing','shipped','ready_for_pickup','completed','cancelled','refunded')),
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

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS order_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name       text NOT NULL,
  slug       text,
  size       text,
  quantity   integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  image_url  text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status          ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session  ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items(order_id);
