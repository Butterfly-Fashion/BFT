-- Multi-item pre-order campaigns: one campaign (e.g. "Winter 2026") can hold many
-- products, and customers commit a quantity per product.

create table if not exists public.preorder_campaign_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.preorder_campaigns(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  unit_price numeric(12, 2) not null default 0,
  case_price numeric(12, 2),
  case_qty integer,
  created_at timestamptz not null default now(),
  unique (campaign_id, product_id)
);

alter table public.preorder_campaign_items enable row level security;
drop policy if exists "preorder_campaign_items read" on public.preorder_campaign_items;
drop policy if exists "preorder_campaign_items admin all" on public.preorder_campaign_items;
create policy "preorder_campaign_items read" on public.preorder_campaign_items
  for select using (true);
create policy "preorder_campaign_items admin all" on public.preorder_campaign_items
  for all using (public.is_admin()) with check (public.is_admin());

-- Commitments become per-product within a campaign.
alter table public.preorder_commitments add column if not exists product_id uuid references public.products(id) on delete cascade;
alter table public.preorder_commitments drop constraint if exists preorder_commitments_campaign_id_customer_id_key;
create unique index if not exists preorder_commitments_campaign_customer_product_key
  on public.preorder_commitments (campaign_id, customer_id, product_id);

-- Legacy single-product campaign columns become optional (kept for old campaigns).
alter table public.preorder_campaigns alter column product_id drop not null;
alter table public.preorder_campaigns alter column unit_price drop not null;
