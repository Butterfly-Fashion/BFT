-- Enable RLS on tables that were created after the initial migration
-- (b2b_categories, categories, b2c_products, b2b_messages, contact_messages, newsletter_subscribers, product_reviews)

-- ── b2b_categories ────────────────────────────────────────────────────────────
-- Public read so the storefront category nav works for everyone.
alter table public.b2b_categories enable row level security;

create policy "b2b categories public read"
  on public.b2b_categories for select
  using (true);

create policy "b2b categories admin write"
  on public.b2b_categories for all
  using (public.is_admin()) with check (public.is_admin());

-- ── categories ────────────────────────────────────────────────────────────────
alter table public.categories enable row level security;

create policy "categories public read"
  on public.categories for select
  using (true);

create policy "categories admin write"
  on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

-- ── b2c_products ──────────────────────────────────────────────────────────────
-- Public read for B2C storefront.
alter table public.b2c_products enable row level security;

create policy "b2c products public read"
  on public.b2c_products for select
  using (true);

create policy "b2c products admin write"
  on public.b2c_products for all
  using (public.is_admin()) with check (public.is_admin());

-- ── b2b_messages ──────────────────────────────────────────────────────────────
-- Customers can only read and insert messages in their own thread.
-- Admin uses service role (bypasses RLS automatically).
alter table public.b2b_messages enable row level security;

create policy "b2b messages self read"
  on public.b2b_messages for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = profile_id
        and p.auth_user_id = auth.uid()
    )
  );

create policy "b2b messages self insert"
  on public.b2b_messages for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = profile_id
        and p.auth_user_id = auth.uid()
    )
  );

-- ── contact_messages ──────────────────────────────────────────────────────────
-- Anyone (including anon) can submit a contact form.
-- Only service role / admin can read submissions.
alter table public.contact_messages enable row level security;

create policy "contact messages public insert"
  on public.contact_messages for insert
  with check (true);

-- No SELECT policy for non-service-role: anon/customers cannot read submissions.

-- ── newsletter_subscribers ────────────────────────────────────────────────────
-- Anyone can subscribe (insert). Only service role can read the list.
alter table public.newsletter_subscribers enable row level security;

create policy "newsletter subscribers public insert"
  on public.newsletter_subscribers for insert
  with check (true);

-- ── product_reviews ───────────────────────────────────────────────────────────
alter table public.product_reviews enable row level security;

create policy "product reviews public read"
  on public.product_reviews for select
  using (true);

create policy "product reviews authenticated insert"
  on public.product_reviews for insert
  with check (auth.uid() is not null);
