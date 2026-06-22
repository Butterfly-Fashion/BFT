-- SEO blog / buyer guides, authored from the admin (rich-text body stored as HTML).

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body_html text not null default '',
  cover_image_url text,
  category text,
  meta_description text,
  status text not null default 'draft',   -- draft | published
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

-- Published posts are public; admins see everything (incl. drafts).
drop policy if exists "blog_posts public read" on public.blog_posts;
drop policy if exists "blog_posts admin all" on public.blog_posts;
create policy "blog_posts public read" on public.blog_posts
  for select using (status = 'published' or public.is_admin());
create policy "blog_posts admin all" on public.blog_posts
  for all using (public.is_admin()) with check (public.is_admin());

create index if not exists blog_posts_published_idx on public.blog_posts (status, published_at desc);
