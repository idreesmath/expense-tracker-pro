-- =============================================================
-- Expense Tracker Pro — Schema
-- Migration 0001: extensions, enums, tables, view, triggers
-- =============================================================

create extension if not exists pgcrypto;

-- ---------- Enums ------------------------------------------------

create type public.currency_code as enum ('USD', 'PKR');
create type public.category_kind as enum ('expense', 'income', 'both');
create type public.transaction_status as enum ('cleared', 'pending', 'scheduled');
create type public.budget_period as enum ('monthly', 'yearly');
create type public.recurring_frequency as enum ('daily', 'weekly', 'monthly', 'yearly');
create type public.account_type as enum ('cash', 'bank', 'card', 'mobile_wallet', 'other');
create type public.payment_kind as enum ('cash', 'card', 'bank_transfer', 'mobile_wallet', 'cheque', 'other');
create type public.notification_type as enum ('budget_alert', 'payment_reminder', 'monthly_summary', 'daily_reminder', 'system');

-- ---------- Reference: currencies (global, read-only) ------------

create table public.currencies (
  code        public.currency_code primary key,
  symbol      text not null,
  name        text not null,
  decimals    smallint not null default 2,
  -- Fixed conversion anchor: 1 unit of this currency = rate_to_usd USD.
  -- Live FX feeds are out of scope; update this value to re-rate the app.
  rate_to_usd numeric(18, 8) not null check (rate_to_usd > 0)
);

-- ---------- Profiles & settings ----------------------------------

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.settings (
  user_id                  uuid primary key references public.profiles (id) on delete cascade,
  currency                 public.currency_code not null default 'USD',
  locale                   text not null default 'en' check (locale in ('en', 'ur')),
  theme                    text not null default 'system' check (theme in ('light', 'dark', 'system')),
  notify_budget_alerts     boolean not null default true,
  notify_monthly_summary   boolean not null default true,
  notify_payment_reminders boolean not null default true,
  notify_daily_reminder    boolean not null default false,
  updated_at               timestamptz not null default now()
);

-- ---------- Accounts & payment methods ---------------------------

create table public.accounts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  type       public.account_type not null default 'cash',
  currency   public.currency_code not null default 'USD',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index accounts_user_idx on public.accounts (user_id);

create table public.payment_methods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  kind       public.payment_kind not null default 'cash',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index payment_methods_user_idx on public.payment_methods (user_id);

-- ---------- Categories --------------------------------------------

create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  name         text not null,
  kind         public.category_kind not null default 'expense',
  color        text not null default '#177154',
  icon         text not null default 'circle-dashed',
  budget_limit numeric(14, 2) check (budget_limit is null or budget_limit > 0),
  is_default   boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (user_id, name)
);
create index categories_user_idx on public.categories (user_id);

-- ---------- Expenses & income (twin ledgers) ----------------------

create table public.expenses (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  account_id        uuid references public.accounts (id) on delete set null,
  category_id       uuid references public.categories (id) on delete set null,
  payment_method_id uuid references public.payment_methods (id) on delete set null,
  amount            numeric(14, 2) not null check (amount > 0),
  currency          public.currency_code not null default 'USD',
  sub_category      text,
  description       text not null,
  notes             text,
  occurred_on       date not null default current_date,
  status            public.transaction_status not null default 'cleared',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index expenses_user_date_idx on public.expenses (user_id, occurred_on desc);
create index expenses_category_idx on public.expenses (category_id);

create table public.income (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  account_id        uuid references public.accounts (id) on delete set null,
  category_id       uuid references public.categories (id) on delete set null,
  payment_method_id uuid references public.payment_methods (id) on delete set null,
  amount            numeric(14, 2) not null check (amount > 0),
  currency          public.currency_code not null default 'USD',
  sub_category      text,
  description       text not null,
  notes             text,
  occurred_on       date not null default current_date,
  status            public.transaction_status not null default 'cleared',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index income_user_date_idx on public.income (user_id, occurred_on desc);
create index income_category_idx on public.income (category_id);

-- Unified transaction history. security_invoker makes the view run
-- with the caller's permissions so base-table RLS applies.
create view public.transactions
with (security_invoker = on) as
select id, user_id, 'expense'::text as type, amount, currency, category_id,
       payment_method_id, account_id, sub_category, description, notes,
       occurred_on, status, created_at, updated_at
from public.expenses
union all
select id, user_id, 'income'::text as type, amount, currency, category_id,
       payment_method_id, account_id, sub_category, description, notes,
       occurred_on, status, created_at, updated_at
from public.income;

-- ---------- Budgets ------------------------------------------------

create table public.budgets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  name            text not null,
  category_id     uuid references public.categories (id) on delete cascade,
  period          public.budget_period not null default 'monthly',
  amount          numeric(14, 2) not null check (amount > 0),
  currency        public.currency_code not null default 'USD',
  alert_threshold smallint not null default 80 check (alert_threshold between 1 and 100),
  starts_on       date not null default date_trunc('month', current_date)::date,
  created_at      timestamptz not null default now()
);
create index budgets_user_idx on public.budgets (user_id);

-- ---------- Attachments (receipts) ---------------------------------

create table public.attachments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  expense_id   uuid references public.expenses (id) on delete cascade,
  income_id    uuid references public.income (id) on delete cascade,
  storage_path text not null,
  file_name    text not null,
  mime_type    text not null,
  size_bytes   integer not null default 0,
  created_at   timestamptz not null default now(),
  check (expense_id is not null or income_id is not null)
);
create index attachments_user_idx on public.attachments (user_id);
create index attachments_expense_idx on public.attachments (expense_id);
create index attachments_income_idx on public.attachments (income_id);

-- ---------- Recurring rules (bills, salaries, subscriptions) -------

create table public.recurring_rules (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  kind              text not null check (kind in ('expense', 'income')),
  description       text not null,
  amount            numeric(14, 2) not null check (amount > 0),
  currency          public.currency_code not null default 'USD',
  category_id       uuid references public.categories (id) on delete set null,
  payment_method_id uuid references public.payment_methods (id) on delete set null,
  frequency         public.recurring_frequency not null default 'monthly',
  next_run_on       date not null,
  end_on            date,
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);
create index recurring_rules_user_idx on public.recurring_rules (user_id, next_run_on);

-- ---------- Financial goals ----------------------------------------

create table public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  name          text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  saved_amount  numeric(14, 2) not null default 0 check (saved_amount >= 0),
  currency      public.currency_code not null default 'USD',
  due_on        date,
  color         text not null default '#177154',
  created_at    timestamptz not null default now()
);
create index goals_user_idx on public.goals (user_id);

-- ---------- Notifications ------------------------------------------

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       public.notification_type not null default 'system',
  title      text not null,
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------- Audit log ----------------------------------------------

create table public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  action     text not null,   -- insert | update | delete
  entity     text not null,   -- table name
  entity_id  uuid,
  details    jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_user_idx on public.audit_logs (user_id, created_at desc);

-- =============================================================
-- Triggers
-- =============================================================

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger expenses_touch before update on public.expenses
  for each row execute function public.touch_updated_at();
create trigger income_touch before update on public.income
  for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Generic audit trigger for user-scoped tables.
create or replace function public.write_audit_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  row_user uuid;
  row_id uuid;
begin
  if tg_op = 'DELETE' then
    row_user := old.user_id; row_id := old.id;
  else
    row_user := new.user_id; row_id := new.id;
  end if;
  insert into public.audit_logs (user_id, action, entity, entity_id, details)
  values (
    row_user,
    lower(tg_op),
    tg_table_name,
    row_id,
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

create trigger expenses_audit after insert or update or delete on public.expenses
  for each row execute function public.write_audit_log();
create trigger income_audit after insert or update or delete on public.income
  for each row execute function public.write_audit_log();
create trigger budgets_audit after insert or update or delete on public.budgets
  for each row execute function public.write_audit_log();
create trigger categories_audit after insert or update or delete on public.categories
  for each row execute function public.write_audit_log();

-- =============================================================
-- New-user bootstrap: profile, settings, account, payment methods,
-- and the 13 default categories.
-- =============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.settings (user_id) values (new.id);

  insert into public.accounts (user_id, name, type, is_default)
  values (new.id, 'Cash', 'cash', true);

  insert into public.payment_methods (user_id, name, kind, is_default) values
    (new.id, 'Cash', 'cash', true),
    (new.id, 'Debit / credit card', 'card', false),
    (new.id, 'Bank transfer', 'bank_transfer', false),
    (new.id, 'Mobile wallet', 'mobile_wallet', false);

  insert into public.categories (user_id, name, kind, color, icon, is_default) values
    (new.id, 'Food',          'expense', '#D98E2B', 'utensils',        true),
    (new.id, 'Transport',     'expense', '#2E7DA6', 'car',             true),
    (new.id, 'Shopping',      'expense', '#B65AA0', 'shopping-bag',    true),
    (new.id, 'Medical',       'expense', '#BE4A5A', 'heart-pulse',     true),
    (new.id, 'Education',     'expense', '#5A63B6', 'graduation-cap',  true),
    (new.id, 'Bills',         'expense', '#8A7A4A', 'receipt',         true),
    (new.id, 'Entertainment', 'expense', '#C46B3A', 'clapperboard',    true),
    (new.id, 'Travel',        'expense', '#3A9B8F', 'plane',           true),
    (new.id, 'Business',      'both',    '#177154', 'briefcase',       true),
    (new.id, 'Salary',        'income',  '#177154', 'banknote',        true),
    (new.id, 'Investment',    'income',  '#2E8B57', 'trending-up',     true),
    (new.id, 'Gift',          'both',    '#B6567E', 'gift',            true),
    (new.id, 'Other',         'both',    '#6B7671', 'circle-dashed',   true);

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- Reference data
-- =============================================================

insert into public.currencies (code, symbol, name, decimals, rate_to_usd) values
  ('USD', '$', 'US Dollar', 2, 1),
  ('PKR', '₨', 'Pakistani Rupee', 2, 0.00359712); -- 1 USD ≈ 278 PKR

-- =============================================================
-- Storage bucket for receipts
-- =============================================================

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Public bucket for profile photos (small, non-sensitive).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
