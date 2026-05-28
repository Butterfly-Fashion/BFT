alter table public.products
  add column if not exists sales_channels text[] not null default array['b2b'];

update public.products
set sales_channels = array['b2b']
where sales_channels is null or cardinality(sales_channels) = 0;

alter table public.products
  drop constraint if exists products_sales_channels_valid;

alter table public.products
  add constraint products_sales_channels_valid
  check (
    cardinality(sales_channels) > 0
    and sales_channels <@ array['b2c', 'b2b']
  );

create index if not exists idx_products_sales_channels
  on public.products using gin (sales_channels);
