-- B2B order admin enhancements:
--  • payment_method  — how the order was paid when settled outside Stripe Checkout
--                      (E-Transfer, Cash, Bank Transfer, Card (in-person), Stripe).
--  • total_override  — admin-set final total that bypasses item-based recalculation,
--                      for per-customer discounts negotiated outside the line items.
-- Shippo columns (shippo_label_url, tracking_number, tracking_url, carrier, shippo_rate_id)
-- already exist on the shared orders table from the B2C schema.

alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists total_override numeric(12, 2);
