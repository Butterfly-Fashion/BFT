create table if not exists public.newsletter_subscribers (
  id            uuid        primary key default gen_random_uuid(),
  email         text        not null,
  source        text        not null default 'footer',
  subscribed_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_unique unique (email)
);

alter table public.newsletter_subscribers enable row level security;

-- Only service role can access (API route uses SUPABASE_SERVICE_ROLE_KEY)
create policy "service_role_only" on public.newsletter_subscribers
  using (false);
