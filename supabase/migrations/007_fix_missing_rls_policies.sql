-- ── FIX: RLS enabled but zero policies on 3 tables ─────────────────────────
-- When RLS is enabled on a table with no policies, Postgres denies ALL access
-- by default — including to the table's own owner. This is why saving opening
-- hours failed with "new row violates row-level security policy". The same gap
-- existed (silently) for order_items and event_registrations.

-- salon_opening_hours: owners manage their own salon's hours; anyone can view
-- hours for a salon (needed on public salon pages / booking flow).
drop policy if exists "Public can view opening hours" on public.salon_opening_hours;
create policy "Public can view opening hours" on public.salon_opening_hours
for select using (true);

drop policy if exists "Owners manage own opening hours" on public.salon_opening_hours;
create policy "Owners manage own opening hours" on public.salon_opening_hours
for all using (
  exists (select 1 from public.salons where id = salon_id and owner_id = auth.uid())
);

-- order_items: order_items are written by the Stripe webhook using the admin
-- client (bypasses RLS), but customers need to be able to READ their own
-- order's line items on /account and /order.
drop policy if exists "Customers view own order items" on public.order_items;
create policy "Customers view own order items" on public.order_items
for select using (
  exists (select 1 from public.orders where id = order_id and customer_id = auth.uid())
);

-- event_registrations: registration is open to anyone (even signed-out
-- visitors), and the existing-registration duplicate check needs to read
-- across all registrations by email. Cancelling is limited to the registrant
-- or the event's organiser.
drop policy if exists "Anyone can register for events" on public.event_registrations;
create policy "Anyone can register for events" on public.event_registrations
for insert with check (true);

drop policy if exists "Registration lookup for duplicate check" on public.event_registrations;
create policy "Registration lookup for duplicate check" on public.event_registrations
for select using (true);

drop policy if exists "Cancel own or organised registrations" on public.event_registrations;
create policy "Cancel own or organised registrations" on public.event_registrations
for delete using (
  auth.uid() = user_id
  or exists (select 1 from public.events where id = event_id and organiser_id = auth.uid())
);
