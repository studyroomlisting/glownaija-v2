-- ── FIX: profiles.email had no unique constraint (defense-in-depth gap) ───────
-- Not exploitable through the normal signup flow (Supabase Auth's own auth.users.email
-- uniqueness prevents that), but nothing stopped a future direct insert into profiles
-- from creating a duplicate. This migration checks for existing duplicates first —
-- if any exist, it raises a clear error instead of silently applying a constraint
-- that could later reject a duplicate you didn't know you had, or worse, silently
-- pick one arbitrarily. safest path is to see the error and decide manually.

do $$
declare
  dup_count integer;
begin
  select count(*) into dup_count
  from (
    select email from public.profiles group by email having count(*) > 1
  ) dupes;

  if dup_count > 0 then
    raise exception 'Cannot add unique constraint: % email(s) have duplicate profiles rows. Resolve manually before re-running this migration.', dup_count;
  end if;
end $$;

alter table public.profiles add constraint profiles_email_unique unique (email);
