-- ============================================================================
-- Migration: add options column to commissions
-- Date: 2026-09-08
--
-- The request form's "Armor complexity" select is now a sub-option of the
-- Armor/weapons/robotic parts checkbox, and the chosen options (background,
-- armor tier) are stored as structured data instead of only being folded
-- into the estimate. Existing rows default to an empty options object.
--
-- Run this BEFORE deploying the site change: the request form starts
-- writing the options column, and a REST insert referencing a missing
-- column would be rejected.
--
-- Idempotent — safe to run more than once.
-- Paste into: Supabase dashboard → SQL Editor → New query → Run.
-- ============================================================================

-- 1. Structured options chosen in the request form
--    e.g. {"background": true, "armor": "simple" | "complex"}
alter table public.commissions
    add column if not exists options jsonb not null default '{}'::jsonb;
