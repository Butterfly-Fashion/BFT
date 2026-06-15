-- Customer-facing stock status for B2C products.
-- Drives the availability label shown on the storefront and whether the item
-- can be purchased. Separate from the internal in_stock flag / stock_qty.
--   in_stock          → "In Stock" (purchasable, default)
--   restock_2_3_days  → "Restock in 2–3 Days" (still purchasable — we restock fast)
--   bestseller        → "Bestseller" (purchasable highlight)
--   sold_out          → "Sold Out" (not purchasable)

alter table b2c_products
  add column if not exists stock_status text not null default 'in_stock'
    check (stock_status in ('in_stock', 'restock_2_3_days', 'bestseller', 'sold_out'));
