-- ── FIX: salon rating/review_count not updating when a customer leaves a review ──
-- Root cause: `recalculate_salon_rating()` runs an UPDATE on public.salons, but the
-- function was NOT `security definer`, so that UPDATE executed under the *reviewer's*
-- own RLS permissions — not the salon owner's. The only UPDATE policies on
-- public.salons are "Owners can manage own salon" (auth.uid() = owner_id) and
-- "Admins can manage all salons" (public.is_admin()). A normal customer posting a
-- review matches neither, so Postgres's row-level security silently filtered the
-- UPDATE down to zero affected rows — no error, the trigger just did nothing. The
-- star rating and review count next to the salon name never changed unless the
-- salon's own owner (or an admin) happened to be the one leaving the review.
--
-- Fix: mark the function `security definer` (same pattern as public.is_admin() in
-- migration 005) so its internal UPDATE runs with the function owner's privileges
-- and bypasses RLS entirely, regardless of who triggered it.

create or replace function public.recalculate_salon_rating()
returns trigger
language plpgsql
security definer
set search_path = public
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

-- Trigger definition itself is unchanged — CREATE OR REPLACE FUNCTION above is
-- enough to swap the implementation the existing "reviews_rating_update" trigger
-- calls, so it doesn't need to be dropped/recreated.

-- One-off backfill so salons that already have reviews (but whose rating/review_count
-- drifted out of sync because of the bug above) show the correct numbers immediately,
-- instead of waiting for their next review to self-correct.
update public.salons s set
  rating       = coalesce((select round(avg(r.rating)::numeric, 1) from public.reviews r where r.salon_id = s.id), 0),
  review_count = (select count(*) from public.reviews r where r.salon_id = s.id);
