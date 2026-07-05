-- =============================================================
-- Expense Tracker Pro — Row Level Security
-- Migration 0002: enable RLS everywhere and restrict rows to owner
-- =============================================================

alter table public.profiles        enable row level security;
alter table public.settings        enable row level security;
alter table public.accounts        enable row level security;
alter table public.payment_methods enable row level security;
alter table public.categories      enable row level security;
alter table public.expenses        enable row level security;
alter table public.income          enable row level security;
alter table public.budgets         enable row level security;
alter table public.attachments     enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.goals           enable row level security;
alter table public.notifications   enable row level security;
alter table public.audit_logs      enable row level security;
alter table public.currencies      enable row level security;

-- ---------- profiles: key is the user id itself -------------------

create policy "profiles_select_own" on public.profiles
  for select using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------- settings ----------------------------------------------

create policy "settings_select_own" on public.settings
  for select using (user_id = (select auth.uid()));
create policy "settings_update_own" on public.settings
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- standard owner CRUD for user-scoped tables -------------

create policy "accounts_crud_own" on public.accounts
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "payment_methods_crud_own" on public.payment_methods
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "categories_crud_own" on public.categories
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "expenses_crud_own" on public.expenses
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "income_crud_own" on public.income
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "budgets_crud_own" on public.budgets
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "attachments_crud_own" on public.attachments
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "recurring_rules_crud_own" on public.recurring_rules
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "goals_crud_own" on public.goals
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "notifications_crud_own" on public.notifications
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- audit_logs: read-only for the owner ---------------------
-- Rows are written by a security-definer trigger; users never write.

create policy "audit_logs_select_own" on public.audit_logs
  for select using (user_id = (select auth.uid()));

-- ---------- currencies: shared read-only reference data -------------

create policy "currencies_read_all" on public.currencies
  for select to authenticated using (true);

-- ---------- storage: receipts scoped to <uid>/... -------------------

create policy "receipts_read_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "receipts_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "receipts_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------- storage: avatars (public read, owner write) -------------

create policy "avatars_read_all" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
