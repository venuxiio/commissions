-- ============================================================================
-- Migration: reference images (attachments column + private storage bucket)
-- Date: 2026-09-11
--
-- The request form's "References" textarea (links) is replaced by up to 3
-- uploaded images. Files live in the PRIVATE bucket 'commission-refs'; the
-- commissions row stores only the storage paths:
--   attachments = ["refs/9b1c….jpg", …]
--
--   anon may INSERT objects into that bucket (the public form uploads before
--   any commissions row exists) but has NO read access — no select policy
--   exists on purpose. The admin board reads previews with service_role,
--   which bypasses RLS, so no read policy is needed.
--
-- Run BEFORE deploying the site change: the form starts writing the
-- attachments column, and a REST insert referencing a missing column
-- would be rejected.
--
-- Idempotent — safe to run more than once.
-- Paste into: Supabase dashboard → SQL Editor → New query → Run.
-- ============================================================================

-- 1. attachments: array of storage paths on the commissions row
alter table public.commissions
    add column if not exists attachments jsonb not null default '[]'::jsonb;

-- 2. Private bucket. The site compresses to ~1600px JPEG client-side;
--    5 MB is just the safety net.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('commission-refs', 'commission-refs', false, 5242880,
        array['image/png','image/jpeg','image/webp'])
on conflict (id) do update
    set public            = excluded.public,
        file_size_limit   = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

-- 3. anon may upload into the bucket — nothing else.
drop policy if exists "commission_refs_anon_insert" on storage.objects;
create policy "commission_refs_anon_insert"
    on storage.objects for insert
    to anon, authenticated
    with check (bucket_id = 'commission-refs');

-- 4. Deliberately NO select/update/delete policies on storage.objects for
--    anon/authenticated: uploads are write-only for the public, previews and
--    cleanup go through service_role. If dashboard → Storage → Policies lists
--    any other policy granting anon access to 'commission-refs', delete it.
