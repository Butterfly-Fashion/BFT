-- Emergency kill-switch flags: lets an admin block online payment, new order
-- requests (B2B/B2C separately), or the whole storefront without a redeploy.
-- Read server-side with the service-role client (no caching) at each choke
-- point; the admin UI is the only writer. One row per switch so each carries
-- its own customer-facing message, reason, and who/when it was flipped.

create table if not exists public.emergency_switches (
  key text primary key,
  enabled boolean not null default false,
  customer_message text not null default '',
  reason text,
  enabled_at timestamptz,
  disabled_at timestamptz,
  enabled_by text,
  updated_at timestamptz not null default now()
);

insert into public.emergency_switches (key, enabled, customer_message) values
  ('tier1_payment', false, 'Online payment is temporarily unavailable. We will follow up by email to arrange payment.'),
  ('tier2_b2b_orders', false, 'We are temporarily not accepting new order requests online. Please email us directly to place an order.'),
  ('tier2_b2c_orders', false, 'Online ordering is temporarily unavailable. Please contact us directly to place an order.'),
  ('tier3_maintenance', false, 'We are down for maintenance and will be back shortly.')
on conflict (key) do nothing;

alter table public.emergency_switches enable row level security;

-- Reads/writes are admin-only via the dashboard. Every runtime check (checkout,
-- order-request, middleware) uses the service-role client, which bypasses RLS.
drop policy if exists "emergency_switches admin read" on public.emergency_switches;
drop policy if exists "emergency_switches admin write" on public.emergency_switches;
create policy "emergency_switches admin read" on public.emergency_switches
  for select using (public.is_admin());
create policy "emergency_switches admin write" on public.emergency_switches
  for all using (public.is_admin()) with check (public.is_admin());
