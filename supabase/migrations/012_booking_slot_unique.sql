-- ── FIX: race condition allows double-booking the same slot ───────────────────
-- createBooking() checked "is this slot taken?" with a SELECT, then did a separate
-- INSERT. Between those two steps, two concurrent requests for the same
-- salon/date/time can both see "not taken" and both succeed — a classic
-- time-of-check-to-time-of-use race condition. No amount of application-code
-- checking can fully close this; only a database constraint can, because Postgres
-- serializes concurrent writes against it.
--
-- Partial (not full) unique index: only 'pending'/'confirmed' bookings block a slot.
-- A cancelled or no-show booking must NOT block the slot from being rebooked.

create unique index bookings_slot_unique
  on public.bookings (salon_id, booking_date, time_slot)
  where status in ('pending', 'confirmed');
