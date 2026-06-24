-- Enable Row-Level Security on the three tables added after 001 that shipped
-- without it (flagged by Supabase: rls_disabled_in_public). With RLS disabled,
-- anyone holding the public anon key could read/edit/delete every row.
--
-- Access patterns (verified in code):
--   contact_messages — insert + admin read/update use service_role only.
--   b2c_products     — storefront read + admin write use service_role only.
--   hero_banners     — read by the B2B home via the anon key (published only);
--                      admin writes go through is_admin()/service_role.
-- service_role bypasses RLS, so the first two need no policies; hero needs a
-- public read policy so the homepage carousel keeps working.

alter table public.contact_messages enable row level security;
alter table public.b2c_products enable row level security;
alter table public.hero_banners enable row level security;

create policy "hero banners public read"
  on public.hero_banners
  for select
  using (is_published = true or public.is_admin());

create policy "hero banners admin write"
  on public.hero_banners
  for all
  using (public.is_admin())
  with check (public.is_admin());
