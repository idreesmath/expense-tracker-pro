-- =============================================================
-- Expense Tracker Pro — Seed data
-- Creates a demo user and ~3 months of realistic activity.
--
--   email:    demo@expensetracker.pro
--   password: Demo@1234
--
-- Run with a privileged connection (supabase db reset picks this
-- up automatically; on hosted projects paste into the SQL editor).
-- =============================================================

do $$
declare
  demo_id uuid := '11111111-1111-4111-8111-111111111111';
  cat_food uuid; cat_transport uuid; cat_shopping uuid; cat_bills uuid;
  cat_medical uuid; cat_entertainment uuid; cat_salary uuid; cat_business uuid;
  cat_investment uuid; cat_travel uuid; cat_education uuid;
  pm_cash uuid; pm_card uuid; pm_bank uuid; pm_wallet uuid;
  acc uuid;
  m0 date := date_trunc('month', current_date)::date;   -- this month
  m1 date := (date_trunc('month', current_date) - interval '1 month')::date;
  m2 date := (date_trunc('month', current_date) - interval '2 months')::date;
begin
  -- --- auth user (triggers profile/settings/categories bootstrap) ---
  if not exists (select 1 from auth.users where id = demo_id) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', demo_id, 'authenticated',
      'authenticated', 'demo@expensetracker.pro',
      crypt('Demo@1234', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Demo User"}', now(), now(), '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), demo_id, demo_id::text,
      jsonb_build_object('sub', demo_id::text, 'email', 'demo@expensetracker.pro', 'email_verified', true),
      'email', now(), now(), now()
    );
  end if;

  -- --- look up bootstrapped rows ------------------------------------
  select id into cat_food          from public.categories where user_id = demo_id and name = 'Food';
  select id into cat_transport     from public.categories where user_id = demo_id and name = 'Transport';
  select id into cat_shopping      from public.categories where user_id = demo_id and name = 'Shopping';
  select id into cat_bills         from public.categories where user_id = demo_id and name = 'Bills';
  select id into cat_medical       from public.categories where user_id = demo_id and name = 'Medical';
  select id into cat_entertainment from public.categories where user_id = demo_id and name = 'Entertainment';
  select id into cat_travel        from public.categories where user_id = demo_id and name = 'Travel';
  select id into cat_education     from public.categories where user_id = demo_id and name = 'Education';
  select id into cat_salary        from public.categories where user_id = demo_id and name = 'Salary';
  select id into cat_business      from public.categories where user_id = demo_id and name = 'Business';
  select id into cat_investment    from public.categories where user_id = demo_id and name = 'Investment';
  select id into pm_cash   from public.payment_methods where user_id = demo_id and kind = 'cash';
  select id into pm_card   from public.payment_methods where user_id = demo_id and kind = 'card';
  select id into pm_bank   from public.payment_methods where user_id = demo_id and kind = 'bank_transfer';
  select id into pm_wallet from public.payment_methods where user_id = demo_id and kind = 'mobile_wallet';
  select id into acc from public.accounts where user_id = demo_id and is_default;

  if exists (select 1 from public.expenses where user_id = demo_id) then
    return; -- already seeded
  end if;

  -- --- income: salary in USD, freelance in PKR ----------------------
  insert into public.income (user_id, account_id, category_id, payment_method_id, amount, currency, description, occurred_on, status) values
    (demo_id, acc, cat_salary,     pm_bank, 3200.00, 'USD', 'Monthly salary',            m2 + 1,  'cleared'),
    (demo_id, acc, cat_salary,     pm_bank, 3200.00, 'USD', 'Monthly salary',            m1 + 1,  'cleared'),
    (demo_id, acc, cat_salary,     pm_bank, 3400.00, 'USD', 'Monthly salary (raise)',    m0 + 1,  'cleared'),
    (demo_id, acc, cat_business,   pm_bank, 85000.00,'PKR', 'Freelance dashboard build', m1 + 12, 'cleared'),
    (demo_id, acc, cat_business,   pm_wallet, 42000.00,'PKR','Consulting session',       m0 + 8,  'cleared'),
    (demo_id, acc, cat_investment, pm_bank, 150.00,  'USD', 'Dividend payout',           m1 + 20, 'cleared');

  -- --- expenses: mixed USD / PKR across categories -------------------
  insert into public.expenses (user_id, account_id, category_id, payment_method_id, amount, currency, sub_category, description, notes, occurred_on, status) values
    (demo_id, acc, cat_food,          pm_card,   86.40,   'USD', 'Groceries',   'Weekly groceries',            null,                 m0 + 2,  'cleared'),
    (demo_id, acc, cat_food,          pm_cash,   1450.00, 'PKR', 'Dining out',  'Biryani lunch with team',     'Karachi office trip', m0 + 4,  'cleared'),
    (demo_id, acc, cat_food,          pm_card,   64.25,   'USD', 'Groceries',   'Groceries & household',       null,                 m0 + 9,  'cleared'),
    (demo_id, acc, cat_transport,     pm_wallet, 950.00,  'PKR', 'Ride-hailing','Careem to airport',           null,                 m0 + 5,  'cleared'),
    (demo_id, acc, cat_transport,     pm_card,   52.00,   'USD', 'Fuel',        'Gas refill',                  null,                 m0 + 7,  'cleared'),
    (demo_id, acc, cat_bills,         pm_bank,   140.00,  'USD', 'Utilities',   'Electricity bill',            null,                 m0 + 6,  'cleared'),
    (demo_id, acc, cat_bills,         pm_bank,   4200.00, 'PKR', 'Internet',    'Fiber internet',              null,                 m0 + 6,  'cleared'),
    (demo_id, acc, cat_bills,         pm_card,   15.99,   'USD', 'Subscriptions','Streaming subscription',     null,                 m0 + 3,  'pending'),
    (demo_id, acc, cat_shopping,      pm_card,   120.00,  'USD', 'Clothing',    'Eid shopping',                null,                 m0 + 10, 'cleared'),
    (demo_id, acc, cat_entertainment, pm_cash,   2200.00, 'PKR', 'Cinema',      'Movie night',                 null,                 m0 + 11, 'cleared'),
    (demo_id, acc, cat_medical,       pm_cash,   3500.00, 'PKR', 'Pharmacy',    'Prescription refill',         null,                 m0 + 8,  'cleared'),

    (demo_id, acc, cat_food,          pm_card,   340.10,  'USD', 'Groceries',   'Monthly groceries',           null,                 m1 + 3,  'cleared'),
    (demo_id, acc, cat_food,          pm_cash,   5200.00, 'PKR', 'Dining out',  'Family dinner',               null,                 m1 + 14, 'cleared'),
    (demo_id, acc, cat_transport,     pm_card,   110.00,  'USD', 'Fuel',        'Fuel & tolls',                null,                 m1 + 9,  'cleared'),
    (demo_id, acc, cat_bills,         pm_bank,   138.00,  'USD', 'Utilities',   'Electricity bill',            null,                 m1 + 6,  'cleared'),
    (demo_id, acc, cat_bills,         pm_bank,   4200.00, 'PKR', 'Internet',    'Fiber internet',              null,                 m1 + 6,  'cleared'),
    (demo_id, acc, cat_shopping,      pm_card,   89.99,   'USD', 'Electronics', 'Mechanical keyboard',         'For the home office', m1 + 18, 'cleared'),
    (demo_id, acc, cat_travel,        pm_card,   420.00,  'USD', 'Flights',     'Flight LHE → DXB',            null,                 m1 + 21, 'cleared'),
    (demo_id, acc, cat_entertainment, pm_wallet, 1800.00, 'PKR', 'Streaming',   'Concert tickets',             null,                 m1 + 25, 'cleared'),

    (demo_id, acc, cat_food,          pm_card,   310.75,  'USD', 'Groceries',   'Monthly groceries',           null,                 m2 + 5,  'cleared'),
    (demo_id, acc, cat_transport,     pm_card,   98.00,   'USD', 'Fuel',        'Fuel',                        null,                 m2 + 8,  'cleared'),
    (demo_id, acc, cat_bills,         pm_bank,   132.00,  'USD', 'Utilities',   'Electricity bill',            null,                 m2 + 6,  'cleared'),
    (demo_id, acc, cat_education,     pm_bank,   24000.00,'PKR', 'Course',      'Online course enrollment',    null,                 m2 + 12, 'cleared'),
    (demo_id, acc, cat_medical,       pm_card,   75.00,   'USD', 'Checkup',     'Annual checkup copay',        null,                 m2 + 15, 'cleared'),
    (demo_id, acc, cat_shopping,      pm_cash,   6500.00, 'PKR', 'Home',        'Kitchenware',                 null,                 m2 + 20, 'cleared');

  -- --- budgets --------------------------------------------------------
  insert into public.budgets (user_id, name, category_id, period, amount, currency, alert_threshold) values
    (demo_id, 'Food & dining',      cat_food,          'monthly', 500.00,   'USD', 80),
    (demo_id, 'Transport',          cat_transport,     'monthly', 200.00,   'USD', 80),
    (demo_id, 'Bills & utilities',  cat_bills,         'monthly', 60000.00, 'PKR', 75),
    (demo_id, 'Entertainment',      cat_entertainment, 'monthly', 100.00,   'USD', 90),
    (demo_id, 'Overall spending',   null,              'monthly', 2000.00,  'USD', 85),
    (demo_id, 'Travel fund',        cat_travel,        'yearly',  3000.00,  'USD', 80);

  -- --- recurring rules (upcoming bills & salary) ----------------------
  insert into public.recurring_rules (user_id, kind, description, amount, currency, category_id, payment_method_id, frequency, next_run_on) values
    (demo_id, 'expense', 'Electricity bill',       140.00,  'USD', cat_bills,  pm_bank,   'monthly', m0 + interval '1 month' + 5),
    (demo_id, 'expense', 'Fiber internet',         4200.00, 'PKR', cat_bills,  pm_bank,   'monthly', m0 + interval '1 month' + 5),
    (demo_id, 'expense', 'Streaming subscription', 15.99,   'USD', cat_bills,  pm_card,   'monthly', m0 + interval '1 month' + 2),
    (demo_id, 'income',  'Monthly salary',         3400.00, 'USD', cat_salary, pm_bank,   'monthly', m0 + interval '1 month');

  -- --- goals -----------------------------------------------------------
  insert into public.goals (user_id, name, target_amount, saved_amount, currency, due_on, color) values
    (demo_id, 'Emergency fund',   10000.00,   4200.00,   'USD', (m0 + interval '10 months')::date, '#177154'),
    (demo_id, 'Umrah trip',       800000.00,  260000.00, 'PKR', (m0 + interval '14 months')::date, '#2E7DA6'),
    (demo_id, 'New laptop',       2200.00,    900.00,    'USD', (m0 + interval '5 months')::date,  '#D98E2B');

  -- --- a welcome notification -----------------------------------------
  insert into public.notifications (user_id, type, title, body) values
    (demo_id, 'system', 'Welcome to Expense Tracker Pro',
     'Your workspace is ready. Add your first expense with the + button or press Ctrl+K to explore.');
end $$;
