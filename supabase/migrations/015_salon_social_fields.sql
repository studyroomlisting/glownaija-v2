-- ── FEATURE: additional social media fields for salon profiles ────────────────
-- Previously only instagram + website existed. Adding the requested platforms.
-- Each is stored as a full https:// URL (or, for whatsapp, a wa.me link) —
-- normalization/validation happens in the app layer (lib/utils.ts) before write.

alter table public.salons
  add column if not exists facebook        text,
  add column if not exists twitter         text,
  add column if not exists youtube         text,
  add column if not exists linkedin        text,
  add column if not exists whatsapp        text,
  add column if not exists google_business text;
