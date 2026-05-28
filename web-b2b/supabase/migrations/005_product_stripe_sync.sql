-- Track automatic Stripe catalog sync for B2B products.
alter table public.products
  add column if not exists stripe_product_id text,
  add column if not exists stripe_price_id text,
  add column if not exists stripe_sync_status text not null default 'pending'
    check (stripe_sync_status in ('pending', 'synced', 'failed')),
  add column if not exists stripe_sync_error text,
  add column if not exists stripe_synced_at timestamptz;

create index if not exists idx_products_stripe_sync_status
  on public.products(stripe_sync_status);

