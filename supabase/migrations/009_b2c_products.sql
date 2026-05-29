-- B2C-specific products table, separate from the shared B2B products table.
-- B2C products are managed through the B2C admin panel only.
-- No B2B fields: sku, barcode, availability_status, is_bulk_available, is_hidden.

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists b2c_products (
  id                uuid        primary key default gen_random_uuid(),
  name              text        not null,
  slug              text        unique not null,
  category          text        not null,
  description       text,
  price             numeric(10,2) not null,
  compare_at_price  numeric(10,2),
  weight_kg         numeric(6,3) not null default 0.5,
  badge             text,
  in_stock          boolean     not null default true,
  stock_qty         integer,
  status            text        not null default 'active'
                    check (status in ('active', 'draft', 'archived')),
  images            jsonb       not null default '[]',
  player_cards      jsonb,
  stripe_product_id text,
  stripe_price_id   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create or replace trigger update_b2c_products_updated_at
  before update on b2c_products
  for each row execute function update_updated_at();

create index if not exists idx_b2c_products_status   on b2c_products(status);
create index if not exists idx_b2c_products_category on b2c_products(category);
create index if not exists idx_b2c_products_slug     on b2c_products(slug);

-- Migrate existing B2C-tagged products from the shared products table.
-- Uses COALESCE to handle the mixed schema (B2C used price, B2B used base_price).
insert into b2c_products (
  name, slug, category, description,
  price, compare_at_price, weight_kg,
  badge, in_stock, stock_qty, status,
  images, player_cards,
  stripe_product_id, stripe_price_id,
  created_at, updated_at
)
select
  name,
  slug,
  category,
  description,
  coalesce(price, base_price, 0),
  compare_at_price,
  coalesce(weight_kg, 0.5),
  badge,
  coalesce(in_stock, true),
  stock_qty,
  coalesce(status, 'active'),
  coalesce(images, '[]'::jsonb),
  player_cards,
  stripe_product_id,
  stripe_price_id,
  created_at,
  updated_at
from products
where 'b2c' = any(sales_channels)
on conflict (slug) do nothing;
