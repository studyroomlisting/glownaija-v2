-- ── FIX: account_type not set to 'owner' for Google OAuth signups ─────────────
-- Root cause: the "List Your Salon" role selection on the signup page was being sent
-- via signInWithOAuth's `queryParams`, which only reaches Google's consent screen and
-- is never stored in Supabase's raw_user_meta_data — so every Google signup silently
-- became account_type='customer' no matter which role was picked. This has been fixed
-- going forward (see app/auth/callback/route.ts and app/auth/signup/page.tsx). This
-- migration backfills anyone already affected: if you already own a salon listing but
-- your profile still says 'customer', you're switched to 'owner' here.

update public.profiles p
set account_type = 'owner'
where account_type <> 'owner'
  and exists (select 1 from public.salons s where s.owner_id = p.id);
