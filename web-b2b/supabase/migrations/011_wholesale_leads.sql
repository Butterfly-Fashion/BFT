-- Wholesale catalog / lead requests from the public site (no account required).
-- Captures the prospect's contact info and acquisition source so we can track
-- where new B2B customers come from (Google, Facebook, referral, direct).

create table if not exists public.wholesale_leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  company text,
  email text not null,
  phone text,
  expected_quantity text,
  message text,
  source text,                       -- UTM params / referrer captured client-side
  status text not null default 'New',-- New | Contacted | Converted | Closed
  created_at timestamptz not null default now()
);

alter table public.wholesale_leads enable row level security;

-- Reads/writes are admin-only. Public submissions are inserted server-side with the
-- service-role key (submitWholesaleLeadAction), which bypasses RLS.
drop policy if exists "wholesale_leads admin read" on public.wholesale_leads;
drop policy if exists "wholesale_leads admin write" on public.wholesale_leads;
create policy "wholesale_leads admin read" on public.wholesale_leads
  for select using (public.is_admin());
create policy "wholesale_leads admin write" on public.wholesale_leads
  for all using (public.is_admin()) with check (public.is_admin());
