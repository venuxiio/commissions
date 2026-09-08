-- ============================================================================
-- Migration: remove public (anon) access to commissions
-- Date: 2026-09-08
--
-- The public commission queue was removed from the site — anon finally has
-- no access to public commissions. This patch:
--   1. drops the commissions_public view (the old anon read path)
--   2. revokes every grant on the base commissions table from anon /
--      authenticated (the request form's INSERT is re-granted below, since
--      the public site still submits requests)
--
-- Idempotent — safe to run more than once.
-- Paste into: Supabase dashboard → SQL Editor → New query → Run.
-- ============================================================================

-- 1. Drop the public view (old anon read path)
drop view if exists public.commissions_public;

-- 2. Strip all grants on the commissions table from public roles
revoke all on public.commissions from anon, authenticated;

-- 3. Re-grant ONLY what the request form still needs: insert request rows.
--    (Columns the form never writes — status is forced to 'request' by the
--    RLS policy below, paid defaults to false — stay unrevealed by REST's
--    column-level grants, but granting bare INSERT with no column list is
--    the simple, correct form here.)
grant insert on public.commissions to anon, authenticated;

-- 4. Belt-and-braces: RLS already had no select policy on commissions, but
--    make sure the insert-request policy is exactly this and nothing wider.
drop policy if exists "commissions_public_insert_request" on public.commissions;
create policy "commissions_public_insert_request"
    on public.commissions for insert
    to anon, authenticated
    with check (
        status = 'request'
        and paid = false
        and coalesce(client, '')  <> ''
        and coalesce(service, '') <> ''
    );

-- 5. Sanity check (run in a second query or check via Table Editor):
--    this must return a 401/403-style error or empty result set with anon:
--      select * from public.commissions;  -- as anon: permission denied
