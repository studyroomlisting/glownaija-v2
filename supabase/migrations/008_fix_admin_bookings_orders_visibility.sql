-- ── FIX: admin dashboard shows zero bookings/orders ────────────────────────
-- bookings and orders only had policies scoped to "your own" (customer_id/owner_id)
-- — there was no policy letting an admin see everything. The admin dashboard page
-- reads these tables with the regular session client (not the service-role client),
-- so every row was silently filtered out by RLS. Uses the is_admin() helper from
-- migration 005 to avoid the same recursion issue fixed there.

drop policy if exists "Admins view all bookings" on public.bookings;
create policy "Admins view all bookings" on public.bookings
for select using (public.is_admin());

drop policy if exists "Admins view all orders" on public.orders;
create policy "Admins view all orders" on public.orders
for select using (public.is_admin());

drop policy if exists "Admins view all enquiries" on public.enquiries;
create policy "Admins view all enquiries" on public.enquiries
for select using (public.is_admin());
