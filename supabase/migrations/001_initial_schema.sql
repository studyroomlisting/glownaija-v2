-- GlowNaija — Supabase/PostgreSQL Schema
-- Run in Supabase SQL Editor or via `supabase db push`

-- Enable UUID generation
-- gen_random_uuid() is built into PostgreSQL 13+ (pgcrypto/pg core), no extension needed

-- ── PROFILES (extends Supabase auth.users) ──────────────────────────────────
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  email         text not null,
  first_name    text not null default '',
  last_name     text not null default '',
  phone         text,
  hair_type     text,
  city          text,
  account_type  text not null default 'customer' check (account_type in ('customer','owner')),
  is_admin      boolean not null default false,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- ── SALONS ───────────────────────────────────────────────────────────────────
create table public.salons (
  id                       uuid primary key default gen_random_uuid(),
  owner_id                 uuid references public.profiles(id) on delete cascade not null,
  name                     text not null,
  slug                     text not null unique,
  description              text,
  emoji                    text not null default '✂️',
  address                  text,
  area                     text not null,
  city                     text not null,
  postcode                 text,
  phone                    text,
  email                    text,
  instagram                text,
  website                  text,
  images                   text[] default '{}',
  price_from               integer not null default 0,
  plan                     text not null default 'starter',
  listing_status           text not null default 'approved',
  is_active                boolean not null default true,
  is_open                  boolean not null default true,
  is_verified              boolean not null default false,
  is_featured              boolean not null default false,
  featured_until           date,
  rating                   numeric(3,1) not null default 0,
  review_count             integer not null default 0,
  total_bookings           integer not null default 0,
  service_types            text[] default '{}',
  tags                     text[] default '{}',
  years_active             integer not null default 0,
  accepts_online_bookings  boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index idx_salons_slug           on public.salons(slug);
create index idx_salons_city           on public.salons(city);
create index idx_salons_status         on public.salons(listing_status, is_active);
create index idx_salons_owner          on public.salons(owner_id);
create index idx_salons_rating         on public.salons(rating desc);

-- ── SERVICES ─────────────────────────────────────────────────────────────────
create table public.services (
  id                uuid primary key default gen_random_uuid(),
  salon_id          uuid references public.salons(id) on delete cascade not null,
  name              text not null,
  description       text,
  emoji             text not null default '✂️',
  price             integer not null,
  duration_minutes  integer not null default 60,
  category          text not null default 'natural',
  is_active         boolean not null default true,
  sort_order        integer not null default 0
);

create index idx_services_salon on public.services(salon_id, is_active);

-- ── OPENING HOURS ────────────────────────────────────────────────────────────
create table public.salon_opening_hours (
  id           uuid primary key default gen_random_uuid(),
  salon_id     uuid references public.salons(id) on delete cascade not null,
  day_of_week  integer not null check (day_of_week between 0 and 6),
  open_time    time,
  close_time   time,
  is_closed    boolean not null default false,
  unique(salon_id, day_of_week)
);

-- ── BOOKINGS ─────────────────────────────────────────────────────────────────
create table public.bookings (
  id              uuid primary key default gen_random_uuid(),
  salon_id        uuid references public.salons(id) on delete cascade not null,
  customer_id     uuid references public.profiles(id) on delete cascade not null,
  service_id      uuid references public.services(id) on delete set null,
  booking_date    date not null,
  time_slot       text not null,
  status          text not null default 'pending'
                  check (status in ('pending','confirmed','completed','cancelled','no_show')),
  reference       text not null unique,
  deposit_amount  integer not null default 0,
  deposit_paid    boolean not null default false,
  notes           text,
  created_at      timestamptz not null default now()
);

create index idx_bookings_salon    on public.bookings(salon_id, booking_date);
create index idx_bookings_customer on public.bookings(customer_id);
create index idx_bookings_date     on public.bookings(booking_date, status);

-- ── PRODUCTS ─────────────────────────────────────────────────────────────────
create table public.products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  brand           text not null,
  category        text not null,
  description     text,
  ingredients     text,
  how_to_use      text,
  price           integer not null,
  original_price  integer,
  images          text[] default '{}',
  stock_count     integer not null default 0,
  is_active       boolean not null default true,
  rating          numeric(3,1) not null default 0,
  review_count    integer not null default 0,
  badge           text,
  badge_type      text,
  tags            text[] default '{}'
);

-- ── ORDERS ───────────────────────────────────────────────────────────────────
create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid references public.profiles(id) on delete cascade not null,
  reference         text not null unique,
  status            text not null default 'pending',
  total             integer not null,
  delivery_cost     integer not null default 299,
  full_name         text not null,
  address           text not null,
  city              text not null,
  postcode          text not null,
  stripe_session_id text,
  created_at        timestamptz not null default now()
);

create table public.order_items (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid references public.orders(id) on delete cascade not null,
  product_id          uuid references public.products(id) on delete set null,
  product_name        text not null,
  price_at_purchase   integer not null,
  quantity            integer not null default 1
);

-- ── REVIEWS ──────────────────────────────────────────────────────────────────
create table public.reviews (
  id             uuid primary key default gen_random_uuid(),
  reviewer_id    uuid references public.profiles(id) on delete cascade not null,
  salon_id       uuid references public.salons(id) on delete cascade not null,
  rating         integer not null check (rating between 1 and 5),
  review_text    text not null,
  service_booked text,
  hair_type      text,
  is_verified    boolean not null default false,
  created_at     timestamptz not null default now(),
  unique(reviewer_id, salon_id)
);

-- ── EVENTS ───────────────────────────────────────────────────────────────────
create table public.events (
  id            uuid primary key default gen_random_uuid(),
  organiser_id  uuid references public.profiles(id) on delete cascade not null,
  title         text not null,
  emoji         text not null default '🎉',
  description   text,
  event_type    text not null default 'workshop',
  event_date    date not null,
  time_start    time not null,
  time_end      time not null,
  venue         text not null,
  city          text not null,
  price         integer not null default 0,
  is_free       boolean not null default false,
  capacity      integer not null default 50,
  rsvp_count    integer not null default 0,
  image_url     text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.event_registrations (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references public.events(id) on delete cascade not null,
  user_id     uuid references public.profiles(id) on delete cascade,
  name        text not null,
  email       text not null,
  phone       text,
  tickets     integer not null default 1,
  created_at  timestamptz not null default now(),
  unique(event_id, email)
);

-- ── SAVED ────────────────────────────────────────────────────────────────────
create table public.saved_salons (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  salon_id   uuid references public.salons(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(user_id, salon_id)
);

create table public.saved_products (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

-- ── ENQUIRIES ────────────────────────────────────────────────────────────────
create table public.enquiries (
  id         uuid primary key default gen_random_uuid(),
  salon_id   uuid references public.salons(id) on delete cascade not null,
  sender_id  uuid references public.profiles(id) on delete set null,
  name       text not null,
  email      text not null,
  phone      text,
  subject    text,
  message    text not null,
  status     text not null default 'unread'
             check (status in ('unread','read','replied','archived')),
  created_at timestamptz not null default now()
);

-- ── COUPONS ──────────────────────────────────────────────────────────────────
create table public.coupons (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  coupon_type      text not null check (coupon_type in ('percent','fixed')),
  value            integer not null,
  min_order_pence  integer not null default 0,
  max_uses         integer,
  uses_count       integer not null default 0,
  valid_from       timestamptz,
  valid_until      timestamptz,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

-- ── NOTIFICATIONS ────────────────────────────────────────────────────────────
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  type       text not null,
  title      text not null,
  body       text,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

-- ── AUDIT LOGS ───────────────────────────────────────────────────────────────
create table public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete set null,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid not null,
  created_at   timestamptz not null default now()
);

-- ── LOGIN HISTORY ────────────────────────────────────────────────────────────
create table public.login_history (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  ip_address   text,
  user_agent   text,
  created_at   timestamptz not null default now()
);

-- ── AUTO-CREATE PROFILE ON SIGNUP ────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, account_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name',  ''),
    coalesce(new.raw_user_meta_data->>'account_type', 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── AUTO-UPDATE salon updated_at ─────────────────────────────────────────────
create or replace function public.update_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger salons_updated_at
  before update on public.salons
  for each row execute procedure public.update_updated_at();

-- ── AUTO-RECALCULATE salon rating after review ────────────────────────────────
create or replace function public.recalculate_salon_rating()
returns trigger language plpgsql
as $$
declare
  v_salon_id uuid;
begin
  v_salon_id = coalesce(new.salon_id, old.salon_id);
  update public.salons set
    rating       = coalesce((select round(avg(rating)::numeric, 1) from public.reviews where salon_id = v_salon_id), 0),
    review_count = (select count(*) from public.reviews where salon_id = v_salon_id)
  where id = v_salon_id;
  return coalesce(new, old);
end;
$$;

create trigger reviews_rating_update
  after insert or update or delete on public.reviews
  for each row execute procedure public.recalculate_salon_rating();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table public.profiles             enable row level security;
alter table public.salons               enable row level security;
alter table public.services             enable row level security;
alter table public.salon_opening_hours  enable row level security;
alter table public.bookings             enable row level security;
alter table public.products             enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.reviews              enable row level security;
alter table public.events               enable row level security;
alter table public.event_registrations  enable row level security;
alter table public.saved_salons         enable row level security;
alter table public.saved_products       enable row level security;
alter table public.enquiries            enable row level security;
alter table public.notifications        enable row level security;
alter table public.coupons              enable row level security;
alter table public.audit_logs           enable row level security;

-- Profiles: users see their own, admins see all
create policy "Users can view own profile"     on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"   on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles"   on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Salons: public can read approved, owners manage own
create policy "Public can view approved salons" on public.salons for select using (listing_status = 'approved' and is_active = true);
create policy "Owners can manage own salon"     on public.salons for all using (auth.uid() = owner_id);
create policy "Admins can manage all salons"    on public.salons for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Services: public read, owners write
create policy "Public can view active services" on public.services for select using (is_active = true);
create policy "Owners can manage services"      on public.services for all using (
  exists (select 1 from public.salons where id = salon_id and owner_id = auth.uid())
);

-- Bookings: customers see own, owners see their salon's
create policy "Customers view own bookings"     on public.bookings for select using (auth.uid() = customer_id);
create policy "Owners view salon bookings"      on public.bookings for select using (
  exists (select 1 from public.salons where id = salon_id and owner_id = auth.uid())
);
create policy "Customers create bookings"       on public.bookings for insert with check (auth.uid() = customer_id);
create policy "Owners update booking status"    on public.bookings for update using (
  exists (select 1 from public.salons where id = salon_id and owner_id = auth.uid())
);

-- Products: public read
create policy "Public can view active products" on public.products for select using (is_active = true);
create policy "Admins manage products"          on public.products for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Notifications: users see own only
create policy "Users view own notifications"   on public.notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "Service role inserts notifs"    on public.notifications for insert with check (true);

-- Reviews: public read, authenticated insert
create policy "Public can view reviews"         on public.reviews for select using (true);
create policy "Users can create reviews"        on public.reviews for insert with check (auth.uid() = reviewer_id);

-- Orders: users see own
create policy "Users view own orders"           on public.orders for select using (auth.uid() = customer_id);
create policy "Users create own orders"         on public.orders for insert with check (auth.uid() = customer_id);

-- Saved: users manage own
create policy "Users manage saved salons"       on public.saved_salons   for all using (auth.uid() = user_id);
create policy "Users manage saved products"     on public.saved_products  for all using (auth.uid() = user_id);

-- Enquiries: owners see their salon's
create policy "Anyone can send enquiry"         on public.enquiries for insert with check (true);
create policy "Owners view enquiries"           on public.enquiries for select using (
  exists (select 1 from public.salons where id = salon_id and owner_id = auth.uid())
);

-- Coupons: public read active
create policy "Public can read active coupons"  on public.coupons for select using (is_active = true);

-- Audit logs: admins only
create policy "Admins view audit logs"          on public.audit_logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "Service role inserts audit logs" on public.audit_logs for insert with check (true);

-- Events: public read active
create policy "Public view active events"       on public.events for select using (is_active = true);
create policy "Organisers manage own events"    on public.events for all using (auth.uid() = organiser_id);

-- Grant anon and authenticated roles access
grant usage  on schema public to anon, authenticated;
grant select on public.salons, public.services, public.salon_opening_hours, public.products, public.reviews, public.events, public.coupons to anon;
grant all    on all tables in schema public to authenticated;
grant all    on all sequences in schema public to authenticated;

-- ── REVIEW REPORTS ───────────────────────────────────────────────────────────
create table public.review_reports (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid references public.reviews(id) on delete cascade not null,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason      text not null,
  status      text not null default 'pending' check (status in ('pending','resolved','dismissed')),
  created_at  timestamptz not null default now()
);
alter table public.review_reports enable row level security;
create policy "Users can report reviews"        on public.review_reports for insert with check (auth.uid() = reporter_id);
create policy "Admins manage review reports"    on public.review_reports for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- ── BUSINESS APPLICATIONS ────────────────────────────────────────────────────
create table public.business_applications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.profiles(id) on delete cascade not null,
  business_name  text not null,
  owner_name     text not null,
  email          text not null,
  phone          text,
  business_type  text,
  area           text,
  city           text,
  instagram      text,
  plan           text not null default 'growth',
  status         text not null default 'approved',
  created_at     timestamptz not null default now()
);
alter table public.business_applications enable row level security;
create policy "Admins manage applications"      on public.business_applications for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "Users view own applications"     on public.business_applications for select using (auth.uid() = user_id);

-- ── EVENT ALERTS ─────────────────────────────────────────────────────────────
create table public.event_alerts (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  city       text not null default 'All',
  created_at timestamptz not null default now(),
  unique(email, city)
);
alter table public.event_alerts enable row level security;
create policy "Anyone can subscribe to alerts"  on public.event_alerts for insert with check (true);

-- ── WAITLIST ─────────────────────────────────────────────────────────────────
create table public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  city       text,
  hair_type  text,
  created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;
create policy "Anyone can join waitlist"        on public.waitlist for insert with check (true);

-- ── COUPON USES ──────────────────────────────────────────────────────────────
create table public.coupon_uses (
  id         uuid primary key default gen_random_uuid(),
  coupon_id  uuid references public.coupons(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  order_id   uuid references public.orders(id) on delete cascade,
  used_at    timestamptz not null default now(),
  unique(coupon_id, user_id)
);
alter table public.coupon_uses enable row level security;
create policy "Users view own coupon uses"      on public.coupon_uses for select using (auth.uid() = user_id);
create policy "Service role inserts coupon uses" on public.coupon_uses for insert with check (true);

-- Auto-increment coupon uses_count
create or replace function public.increment_coupon_uses()
returns trigger language plpgsql security definer
as $$
begin
  update public.coupons set uses_count = uses_count + 1 where id = new.coupon_id;
  return new;
end;
$$;
create trigger coupon_used
  after insert on public.coupon_uses
  for each row execute procedure public.increment_coupon_uses();

-- ── STOCK MANAGEMENT ─────────────────────────────────────────────────────────
-- Called from stripe-webhook after successful order
create or replace function public.decrement_stock(product_id uuid, quantity integer)
returns void language plpgsql security definer
as $$
begin
  update public.products
  set stock_count = greatest(0, stock_count - quantity)
  where id = product_id;
end;
$$;

-- Index for fast product lookups by category and active status
create index if not exists idx_products_category    on public.products(category, is_active);
create index if not exists idx_products_active       on public.products(is_active, rating desc);
create index if not exists idx_order_items_order     on public.order_items(order_id);
create index if not exists idx_order_items_product   on public.order_items(product_id);
create index if not exists idx_orders_customer       on public.orders(customer_id, created_at desc);
create index if not exists idx_saved_products_user   on public.saved_products(user_id);
