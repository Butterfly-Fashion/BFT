-- Phase 1: Add unit_price / case_price / case_qty to products
-- Keep base_price column (add default so old code doesn't break)
alter table public.products
  add column unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  add column case_price numeric(12, 2) check (case_price >= 0),
  add column case_qty  integer         check (case_qty > 0);

alter table public.products alter column base_price set default 0;

-- Migrate: copy base_price → unit_price for all existing rows
update public.products set unit_price = base_price;

-- Phase 2: Add unit_price / case_price to customer_prices
-- Keep price column (add default so old code doesn't break)
alter table public.customer_prices
  add column unit_price numeric(12, 2) check (unit_price >= 0),
  add column case_price numeric(12, 2) check (case_price >= 0);

alter table public.customer_prices alter column price set default 0;

-- Migrate: copy price → unit_price for all existing rows
update public.customer_prices set unit_price = price;

-- Phase 3: Pre-order tables
create type public.preorder_status as enum ('open', 'closed', 'cancelled');

create table public.preorder_campaigns (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete restrict,
  title       text not null,
  description text not null default '',
  unit_price  numeric(12, 2) not null check (unit_price >= 0),
  case_price  numeric(12, 2) check (case_price >= 0),
  case_qty    integer        check (case_qty > 0),
  status      public.preorder_status not null default 'open',
  closes_at   timestamptz,
  admin_notes text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.preorder_commitments (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.preorder_campaigns(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  quantity    integer not null check (quantity > 0),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (campaign_id, customer_id)
);

-- RLS
alter table public.preorder_campaigns   enable row level security;
alter table public.preorder_commitments enable row level security;

-- Only approved B2B customers (+ admins) can see campaigns
create policy "preorder campaigns approved read" on public.preorder_campaigns for select using (
  public.is_admin()
  or exists (
    select 1 from public.profiles p
    where p.auth_user_id = auth.uid() and p.is_b2b_approved = true
  )
);
create policy "preorder campaigns admin write" on public.preorder_campaigns
  for all using (public.is_admin()) with check (public.is_admin());

-- Customers can read their own commitments; admins see all
create policy "preorder commitments self read" on public.preorder_commitments for select using (
  public.is_admin()
  or exists (select 1 from public.profiles p where p.id = customer_id and p.auth_user_id = auth.uid())
);
create policy "preorder commitments self insert" on public.preorder_commitments for insert with check (
  exists (
    select 1 from public.profiles p
    where p.id = customer_id and p.auth_user_id = auth.uid() and p.is_b2b_approved = true
  )
);
create policy "preorder commitments self update" on public.preorder_commitments for update using (
  exists (
    select 1 from public.profiles p
    where p.id = customer_id and p.auth_user_id = auth.uid() and p.is_b2b_approved = true
  )
);
create policy "preorder commitments admin all" on public.preorder_commitments
  for all using (public.is_admin()) with check (public.is_admin());
