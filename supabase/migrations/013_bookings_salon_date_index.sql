-- ── PERFORMANCE: missing index for the most common bookings query pattern ─────
-- Every owner-dashboard load and every customer-facing slot-picker check filters
-- bookings by (salon_id, booking_date). The new unique index from migration 012
-- covers (salon_id, booking_date, time_slot) for active statuses only — this
-- adds a plain supporting index for the broader query pattern (all statuses,
-- used by the dashboard's booking list/analytics), so neither query path is
-- ever a sequential scan as booking volume grows.

create index if not exists idx_bookings_salon_date on public.bookings (salon_id, booking_date);
