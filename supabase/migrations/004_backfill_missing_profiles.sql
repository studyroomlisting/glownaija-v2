-- ── FIX: some auth.users accounts have NO row in public.profiles at all ───────
-- Root cause: these accounts signed up before the handle_new_user() trigger (and the
-- public.profiles table itself) existed in this database — i.e. before the initial
-- migration was successfully applied. The trigger only fires on NEW signups, so it
-- never retroactively created profiles for accounts that already existed in auth.users.
--
-- Symptoms this explains: header avatar showing "?", /account showing no account
-- type, and "Could not create salon" (salons.owner_id is a foreign key to
-- public.profiles(id) — the insert fails if there's no matching profiles row).

insert into public.profiles (id, email, first_name, last_name, account_type)
select
  u.id,
  u.email,
  coalesce(
    nullif(u.raw_user_meta_data->>'first_name', ''),
    nullif(u.raw_user_meta_data->>'given_name', ''),
    nullif(split_part(u.raw_user_meta_data->>'full_name', ' ', 1), ''),
    nullif(split_part(u.raw_user_meta_data->>'name', ' ', 1), ''),
    ''
  ),
  coalesce(
    nullif(u.raw_user_meta_data->>'last_name', ''),
    nullif(u.raw_user_meta_data->>'family_name', ''),
    ''
  ),
  coalesce(u.raw_user_meta_data->>'account_type', 'customer')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
