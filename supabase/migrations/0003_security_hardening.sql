-- =============================================================
-- Expense Tracker Pro — Security hardening
-- Migration 0003: fixes raised by the Supabase security advisor
-- =============================================================

-- Pin the search_path of the updated_at trigger function.
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Trigger-only SECURITY DEFINER functions must not be callable via
-- the PostgREST /rpc surface.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.write_audit_log() from anon, authenticated, public;

-- The avatars bucket is public: object URLs work without a SELECT
-- policy, and the broad policy allowed listing every file. Replace
-- it with owner-scoped listing only.
drop policy if exists "avatars_read_all" on storage.objects;
create policy "avatars_list_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
