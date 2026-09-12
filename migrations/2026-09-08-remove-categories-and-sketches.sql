-- ============================================================================
-- Migration: remove service categories + sketch services
-- Date: 2026-09-08
--
-- The Services section no longer groups services into "Full render" /
-- "Sketch" (single flat grid now), and the sketch services are gone from
-- the offering entirely. The no-shading −15% option was removed from the
-- request form too (data side unaffected — it was never stored).
--
-- This patch:
--   1. deletes the sketch service rows
--   2. drops the category column (site no longer reads it)
--
-- Idempotent — safe to run more than once.
-- Paste into: Supabase dashboard → SQL Editor → New query → Run.
-- ============================================================================

-- 1. Remove sketch services
delete from public.services where category = 'sketch';

-- 2. Drop the category column
alter table public.services drop column if exists category;
