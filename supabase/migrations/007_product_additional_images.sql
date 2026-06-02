alter table public.products
  add column if not exists additional_images text[] not null default '{}';
