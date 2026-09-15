-- ============================================================
-- Al-Sami Creation's — Database Schema
-- Paste this whole file into Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- Extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PROFILES (extends auth.users with a role)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CUSTOMERS
-- ------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  factory_code text,
  phone text,
  address text,
  photo_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ARTICLES (dress inventory items, e.g. "Z 208 Pink")
-- ------------------------------------------------------------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ORDERS (one per customer, auto-numbered 1,2,3.. per customer)
-- ------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_number integer not null,
  status text not null default 'pending' check (status in ('pending', 'partial', 'closed')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, order_number)
);

-- Auto-assign order_number per customer
create or replace function public.set_order_number()
returns trigger as $$
begin
  if new.order_number is null then
    select coalesce(max(order_number), 0) + 1
      into new.order_number
      from public.orders
      where customer_id = new.customer_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_order_number on public.orders;
create trigger trg_set_order_number
  before insert on public.orders
  for each row execute function public.set_order_number();

-- ------------------------------------------------------------
-- ORDER ITEMS (one row per article+size within an order)
-- qty_ordered   = total pieces requested for that size
-- qty_delivered = pieces given to customer so far (drives partial/closed)
-- ------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  article_id uuid not null references public.articles(id),
  size text not null check (size in ('XS', 'S', 'M', 'L', 'XL')),
  qty_ordered integer not null default 0 check (qty_ordered >= 0),
  qty_delivered integer not null default 0 check (qty_delivered >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, article_id, size)
);

-- ------------------------------------------------------------
-- RETURNS (separate log, does not affect order quantities)
-- ------------------------------------------------------------
create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  article_id uuid not null references public.articles(id),
  size text not null check (size in ('XS', 'S', 'M', 'L', 'XL')),
  qty integer not null check (qty > 0),
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Keep order status in sync whenever order_items change
-- ------------------------------------------------------------
create or replace function public.recalc_order_status(p_order_id uuid)
returns void as $$
declare
  total_ordered integer;
  total_delivered integer;
begin
  select coalesce(sum(qty_ordered), 0), coalesce(sum(qty_delivered), 0)
    into total_ordered, total_delivered
    from public.order_items
    where order_id = p_order_id;

  update public.orders
    set status = case
          when total_ordered = 0 then 'pending'
          when total_delivered <= 0 then 'pending'
          when total_delivered >= total_ordered then 'closed'
          else 'partial'
        end,
        updated_at = now()
    where id = p_order_id;
end;
$$ language plpgsql;

create or replace function public.order_items_after_change()
returns trigger as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recalc_order_status(old.order_id);
    return old;
  else
    perform public.recalc_order_status(new.order_id);
    return new;
  end if;
end;
$$ language plpgsql;

drop trigger if exists trg_order_items_after_change on public.order_items;
create trigger trg_order_items_after_change
  after insert or update or delete on public.order_items
  for each row execute function public.order_items_after_change();

-- ------------------------------------------------------------
-- updated_at auto-touch helper
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_customers_touch on public.customers;
create trigger trg_customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_articles_touch on public.articles;
create trigger trg_articles_touch before update on public.articles
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- New auth user -> auto create profile row (role defaults to 'user';
-- the very first user who signs up is promoted to 'admin' automatically)
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
declare
  existing_count integer;
begin
  select count(*) into existing_count from public.profiles;
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when existing_count = 0 then 'admin' else 'user' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Row Level Security
-- Every logged-in user (admin or staff) has identical read/write
-- access, per your requirements. Two things are admin-only:
--  1) creating new staff logins — handled through a server route
--     with the service role key, not through these policies.
--  2) deleting customers or articles — enforced below at the
--     database level (not just hidden in the UI), so it can't be
--     bypassed even by calling the API directly.
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.articles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.returns enable row level security;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "customers_all_authenticated" on public.customers;
drop policy if exists "customers_select_authenticated" on public.customers;
create policy "customers_select_authenticated" on public.customers
  for select using (auth.role() = 'authenticated');
drop policy if exists "customers_insert_authenticated" on public.customers;
create policy "customers_insert_authenticated" on public.customers
  for insert with check (auth.role() = 'authenticated');
drop policy if exists "customers_update_authenticated" on public.customers;
create policy "customers_update_authenticated" on public.customers
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "customers_delete_admin_only" on public.customers;
create policy "customers_delete_admin_only" on public.customers
  for delete using (public.is_admin());

drop policy if exists "articles_all_authenticated" on public.articles;
drop policy if exists "articles_select_authenticated" on public.articles;
create policy "articles_select_authenticated" on public.articles
  for select using (auth.role() = 'authenticated');
drop policy if exists "articles_insert_authenticated" on public.articles;
create policy "articles_insert_authenticated" on public.articles
  for insert with check (auth.role() = 'authenticated');
drop policy if exists "articles_update_authenticated" on public.articles;
create policy "articles_update_authenticated" on public.articles
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "articles_delete_admin_only" on public.articles;
create policy "articles_delete_admin_only" on public.articles
  for delete using (public.is_admin());

drop policy if exists "orders_all_authenticated" on public.orders;
create policy "orders_all_authenticated" on public.orders
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "order_items_all_authenticated" on public.order_items;
create policy "order_items_all_authenticated" on public.order_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "returns_all_authenticated" on public.returns;
create policy "returns_all_authenticated" on public.returns
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- Storage buckets for photos (public read so <img> tags just work)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('customer-photos', 'customer-photos', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('article-photos', 'article-photos', true)
  on conflict (id) do nothing;

drop policy if exists "customer_photos_public_read" on storage.objects;
create policy "customer_photos_public_read" on storage.objects
  for select using (bucket_id = 'customer-photos');

drop policy if exists "customer_photos_auth_write" on storage.objects;
create policy "customer_photos_auth_write" on storage.objects
  for insert with check (bucket_id = 'customer-photos' and auth.role() = 'authenticated');

drop policy if exists "customer_photos_auth_update" on storage.objects;
create policy "customer_photos_auth_update" on storage.objects
  for update using (bucket_id = 'customer-photos' and auth.role() = 'authenticated');

drop policy if exists "customer_photos_auth_delete" on storage.objects;
create policy "customer_photos_auth_delete" on storage.objects
  for delete using (bucket_id = 'customer-photos' and auth.role() = 'authenticated');

drop policy if exists "article_photos_public_read" on storage.objects;
create policy "article_photos_public_read" on storage.objects
  for select using (bucket_id = 'article-photos');

drop policy if exists "article_photos_auth_write" on storage.objects;
create policy "article_photos_auth_write" on storage.objects
  for insert with check (bucket_id = 'article-photos' and auth.role() = 'authenticated');

drop policy if exists "article_photos_auth_update" on storage.objects;
create policy "article_photos_auth_update" on storage.objects
  for update using (bucket_id = 'article-photos' and auth.role() = 'authenticated');

drop policy if exists "article_photos_auth_delete" on storage.objects;
create policy "article_photos_auth_delete" on storage.objects
  for delete using (bucket_id = 'article-photos' and auth.role() = 'authenticated');

-- ============================================================
-- Done. Next: Authentication -> Providers -> make sure "Email"
-- is enabled, and Authentication -> Settings -> turn OFF "Confirm email"
-- (so staff logins work instantly without an email step).
-- ============================================================
