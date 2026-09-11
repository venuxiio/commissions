-- ============================================================================
-- Migration: drop the services + settings tables
-- Date: 2026-09-11
--
-- Services (types/prices) and settings (open/closed, reopen date, slots) are
-- no longer stored in the database — commissions.js is now the single source
-- of truth for both, hand-edited like portfolio.js. The public site no longer
-- calls /rest/v1/services or /rest/v1/settings, and the admin board has no
-- settings panel. The database keeps exactly one job: commission requests.
--
-- DESTRUCTIVE: rows in services / settings are deleted permanently.
--
-- This patch:
--   1. drops the services_public_read / settings_public_read policies
--   2. revokes the anon / authenticated grants on both tables
--   3. drops both tables
--
-- (1) and (2) are implied by (3) — policies and grants live on the table and
-- die with it — but they are spelled out so the intent is visible, and they
-- are guarded so a second run can't error on a table that's already gone.
--
-- Idempotent — safe to run more than once.
-- Paste into: Supabase dashboard → SQL Editor → New query → Run.
-- ============================================================================

do $$
begin
  if to_regclass('public.services') is not null then
    drop policy if exists "services_public_read" on public.services;
    revoke all on public.services from anon, authenticated;
  end if;
  if to_regclass('public.settings') is not null then
    drop policy if exists "settings_public_read" on public.settings;
    revoke all on public.settings from anon, authenticated;
  end if;
end $$;

drop table if exists public.services cascade;
drop table if exists public.settings cascade;

-- Sanity check: only the commissions table should remain
--   select tablename from pg_tables where schemaname = 'public';
