-- ── FIX: products table has no created_at column ──────────────────────────
-- Every other table has created_at for ordering/auditing; products was missing
-- it, which the new admin product-management UI needs to show newest first.

alter table public.products
  add column if not exists created_at timestamptz not null default now();
