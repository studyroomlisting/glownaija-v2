-- ── Rate limiting for sign-in, password reset, and the contact form ───────────
-- Supabase's own GoTrue backend has baseline throttling on auth endpoints, but that's
-- a platform-wide default, not a policy this app controls. This table backs an
-- app-level limiter for the specific endpoints that don't otherwise have one.

create table public.rate_limit_attempts (
  id          uuid primary key default gen_random_uuid(),
  identifier  text not null,   -- typically the email address being acted on
  action      text not null,   -- 'signin' | 'reset_password' | 'contact'
  created_at  timestamptz not null default now()
);

create index idx_rate_limit_lookup on public.rate_limit_attempts(identifier, action, created_at);

alter table public.rate_limit_attempts enable row level security;

-- No public policies at all: this table is only ever read/written via the
-- service-role admin client from server-only code, never from the browser.
