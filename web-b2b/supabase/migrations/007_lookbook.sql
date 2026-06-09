create table public.lookbook_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  season text,
  linked_product_slug text,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.lookbook_items enable row level security;

create policy "Public can read published lookbook items"
  on public.lookbook_items for select
  using (is_published = true);

create policy "Admin can manage lookbook items"
  on public.lookbook_items for all
  using (
    exists (
      select 1 from public.profiles
      where auth_user_id = auth.uid()
      and role = 'admin'
    )
  );
