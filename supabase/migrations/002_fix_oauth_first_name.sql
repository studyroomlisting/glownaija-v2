-- ── FIX: Google OAuth signups leave first_name/last_name empty ────────────────
-- Root cause: handle_new_user() only ever looked at raw_user_meta_data->>'first_name',
-- which is only present for email/password signups (where the signup form sends it
-- explicitly). Google OAuth populates different keys (given_name/family_name, or a
-- single full_name/name), so Google sign-ins were getting '' for both fields —
-- which is why the header avatar fell back to "?" instead of showing an initial.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, account_type)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'first_name', ''),
      nullif(new.raw_user_meta_data->>'given_name', ''),
      nullif(split_part(new.raw_user_meta_data->>'full_name', ' ', 1), ''),
      nullif(split_part(new.raw_user_meta_data->>'name', ' ', 1), ''),
      ''
    ),
    coalesce(
      nullif(new.raw_user_meta_data->>'last_name', ''),
      nullif(new.raw_user_meta_data->>'family_name', ''),
      ''
    ),
    coalesce(new.raw_user_meta_data->>'account_type', 'customer')
  );
  return new;
end;
$$;

-- Backfill: fix accounts that already signed up via Google before this fix
-- (e.g. any owner/customer whose profile currently shows an empty first_name).
update public.profiles p
set
  first_name = coalesce(
    nullif(p.first_name, ''),
    nullif(u.raw_user_meta_data->>'given_name', ''),
    nullif(split_part(u.raw_user_meta_data->>'full_name', ' ', 1), ''),
    nullif(split_part(u.raw_user_meta_data->>'name', ' ', 1), ''),
    p.first_name
  ),
  last_name = coalesce(
    nullif(p.last_name, ''),
    nullif(u.raw_user_meta_data->>'family_name', ''),
    p.last_name
  )
from auth.users u
where p.id = u.id
  and (p.first_name is null or p.first_name = '');
