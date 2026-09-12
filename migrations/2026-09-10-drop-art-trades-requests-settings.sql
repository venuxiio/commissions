-- ============================================================================
-- Migration: drop art_trades_open / requests_open from settings
-- Date: 2026-09-10
--
-- The public site no longer shows the ✓/✗ chips for ART TRADES and
-- REQUESTS — only the single commissions status banner remains
-- ("Commissions are open" / "Commissions are closed until …"), driven by
-- comms_open + reopen_date. These two columns are now unused everywhere.
--
-- This patch:
--   1. drops the art_trades_open column
--   2. drops the requests_open column
--
-- Idempotent — safe to run more than once.
-- Paste into: Supabase dashboard → SQL Editor → New query → Run.
-- ============================================================================

alter table public.settings drop column if exists art_trades_open;
alter table public.settings drop column if exists requests_open;
