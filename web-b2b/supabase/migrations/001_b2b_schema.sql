create extension if not exists "pgcrypto";

create type public.user_role as enum ('guest', 'customer', 'admin');
create type public.order_status as enum (
  'Pending Review',
  'Approved',
  'Payment Link Sent',
  'Paid',
  'Processing',
  'Label Created',
  'Ready for Pickup',
  'Shipped',
  'Completed',
  'Cancelled',
  'Refunded'
);
create type public.payment_status as enum ('Unpaid', 'Payment Link Sent', 'Paid', 'Refunded', 'Failed');
create type public.availability_status as enum ('Available', 'Limited', 'Manual Confirm', 'Hidden');
create type public.delivery_method as enum ('Pickup', 'Shipping');
create type public.quote_status as enum ('Pending', 'Responded', 'Converted', 'Closed', 'Cancelled');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  role public.user_role not null default 'customer',
  business_name text not null,
  contact_name text not null,
  email text not null unique,
  phone text not null,
  business_address text not null,
  city text not null,
  province text not null,
  postal_code text not null,
  country text not null default 'Canada',
  business_type text not null,
  is_b2b_approved boolean not null default false,
  tax_number text,
  website text,
  notes text,
  preferred_delivery_method public.delivery_method,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  sku text not null unique,
  barcode text,
  base_price numeric(12, 2) not null check (base_price >= 0),
  image_url text,
  category text not null,
  availability_status public.availability_status not null default 'Manual Confirm',
  is_bulk_available boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_prices (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  price numeric(12, 2) not null check (price >= 0),
  min_quantity integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, product_id, min_quantity)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  status public.order_status not null default 'Pending Review',
  payment_status public.payment_status not null default 'Unpaid',
  subtotal numeric(12, 2) not null default 0,
  shipping_fee numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  tax_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  delivery_method public.delivery_method not null,
  shipping_address text,
  customer_notes text,
  admin_notes text,
  stripe_payment_link text,
  stripe_session_id text,
  stripe_payment_intent text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  sku_snapshot text not null,
  quantity integer not null check (quantity > 0),
  unit_price_snapshot numeric(12, 2) not null check (unit_price_snapshot >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  status public.quote_status not null default 'Pending',
  message text,
  admin_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  requested_price numeric(12, 2),
  admin_offered_price numeric(12, 2)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  invoice_number text not null unique,
  pdf_url text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.customer_prices enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.invoices enable row level security;

create policy "profiles self read" on public.profiles for select using (auth_user_id = auth.uid() or public.is_admin());
create policy "profiles self update" on public.profiles for update using (auth_user_id = auth.uid() or public.is_admin());
create policy "profiles insert own" on public.profiles for insert with check (auth_user_id = auth.uid());

create policy "products public visible" on public.products for select using (not is_hidden or public.is_admin());
create policy "products admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "customer prices self read" on public.customer_prices for select using (
  public.is_admin()
  or exists (select 1 from public.profiles p where p.id = customer_id and p.auth_user_id = auth.uid())
);
create policy "customer prices admin write" on public.customer_prices for all using (public.is_admin()) with check (public.is_admin());

create policy "orders self read" on public.orders for select using (
  public.is_admin()
  or exists (select 1 from public.profiles p where p.id = customer_id and p.auth_user_id = auth.uid())
);
create policy "orders self insert" on public.orders for insert with check (
  exists (select 1 from public.profiles p where p.id = customer_id and p.auth_user_id = auth.uid())
);
create policy "orders admin update" on public.orders for update using (public.is_admin());

create policy "order items self read" on public.order_items for select using (
  public.is_admin()
  or exists (
    select 1 from public.orders o
    join public.profiles p on p.id = o.customer_id
    where o.id = order_id and p.auth_user_id = auth.uid()
  )
);
create policy "order items self insert" on public.order_items for insert with check (
  exists (
    select 1 from public.orders o
    join public.profiles p on p.id = o.customer_id
    where o.id = order_id and p.auth_user_id = auth.uid()
  )
);
create policy "order items admin update" on public.order_items for update using (public.is_admin());

create policy "quotes self read" on public.quotes for select using (
  public.is_admin()
  or exists (select 1 from public.profiles p where p.id = customer_id and p.auth_user_id = auth.uid())
);
create policy "quotes self insert" on public.quotes for insert with check (
  exists (select 1 from public.profiles p where p.id = customer_id and p.auth_user_id = auth.uid())
);
create policy "quotes admin update" on public.quotes for update using (public.is_admin());

create policy "quote items self read" on public.quote_items for select using (
  public.is_admin()
  or exists (
    select 1 from public.quotes q
    join public.profiles p on p.id = q.customer_id
    where q.id = quote_id and p.auth_user_id = auth.uid()
  )
);
create policy "quote items self insert" on public.quote_items for insert with check (
  exists (
    select 1 from public.quotes q
    join public.profiles p on p.id = q.customer_id
    where q.id = quote_id and p.auth_user_id = auth.uid()
  )
);
create policy "quote items admin update" on public.quote_items for update using (public.is_admin());

create policy "invoices self read" on public.invoices for select using (
  public.is_admin()
  or exists (
    select 1 from public.orders o
    join public.profiles p on p.id = o.customer_id
    where o.id = order_id and p.auth_user_id = auth.uid()
  )
);
create policy "invoices admin write" on public.invoices for all using (public.is_admin()) with check (public.is_admin());

