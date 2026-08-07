-- ── FIX: salons.price_from / service_types were never synced with real services ─
-- price_from was written once at creation (never — it defaulted to 0 and nothing
-- ever set it after that), so price filtering/sorting on /salons always operated
-- on 0 for every salon. service_types was set once at signup from a coarse
-- business-type guess (e.g. "Hair Salon" -> ['braids','natural','colour']) and
-- never updated when the owner actually added real services afterwards — so the
-- Service Type filter reflected a guess, not what the salon actually offers.
--
-- Fix: both fields are now derived from the services table itself (the real
-- source of truth) via a trigger that fires on any insert/update/delete to
-- services, so they can never drift out of sync again regardless of which code
-- path changes a service.

create or replace function public.sync_salon_from_services()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_salon_id uuid;
begin
  target_salon_id := coalesce(new.salon_id, old.salon_id);

  update public.salons s
  set
    price_from = coalesce(
      (select min(price) / 100 from public.services where salon_id = target_salon_id and is_active = true),
      0
    ),
    service_types = coalesce(
      (select array_agg(distinct category) from public.services where salon_id = target_salon_id and is_active = true),
      '{}'
    )
  where s.id = target_salon_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sync_salon_from_services on public.services;
create trigger trg_sync_salon_from_services
  after insert or update or delete on public.services
  for each row execute function public.sync_salon_from_services();

-- Backfill existing salons once so already-added services are reflected immediately,
-- not just future changes.
update public.salons s
set
  price_from = coalesce((select min(price) / 100 from public.services where salon_id = s.id and is_active = true), 0),
  service_types = coalesce((select array_agg(distinct category) from public.services where salon_id = s.id and is_active = true), s.service_types);
