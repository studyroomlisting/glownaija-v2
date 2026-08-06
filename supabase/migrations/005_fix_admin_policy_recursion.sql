-- ── FIX: infinite recursion in "Admins can view all profiles" RLS policy ──────
-- Root cause: the policy's USING clause ran `select 1 from public.profiles ...`
-- — a query against the SAME table the policy protects. Postgres has to
-- re-evaluate RLS for that inner query too, which re-triggers this same policy,
-- forever. The fix is a SECURITY DEFINER helper function: it runs with the
-- function owner's privileges, so its internal lookup bypasses RLS entirely and
-- the recursion never starts. This also replaces the same duplicated
-- exists(select 1 from public.profiles ...) pattern everywhere else it was
-- copy-pasted, for consistency and slightly better performance.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

drop policy if exists "Admins can view all profiles"   on public.profiles;
drop policy if exists "Admins can manage all salons"    on public.salons;
drop policy if exists "Admins manage products"          on public.products;
drop policy if exists "Admins view audit logs"          on public.audit_logs;
drop policy if exists "Admins manage review reports"    on public.review_reports;
drop policy if exists "Admins manage applications"      on public.business_applications;

create policy "Admins can view all profiles" on public.profiles              for select using (public.is_admin());
create policy "Admins can manage all salons" on public.salons                for all    using (public.is_admin());
create policy "Admins manage products"       on public.products              for all    using (public.is_admin());
create policy "Admins view audit logs"       on public.audit_logs            for select using (public.is_admin());
create policy "Admins manage review reports" on public.review_reports        for all    using (public.is_admin());
create policy "Admins manage applications"   on public.business_applications for all    using (public.is_admin());
