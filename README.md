# Expense Tracker Pro

A production-ready, **multi-currency (USD / PKR)**, **bilingual (English / اردو with full RTL)** personal & small-business finance app. Built with Next.js 16 (App Router), Supabase, Tailwind CSS 4 and shadcn/ui, and optimized for one-click deployment on Vercel.

**🌐 Live app:** [https://expense-tracker-pro-idrees.vercel.app/](https://expense-tracker-pro-idrees.vercel.app/)

> **Demo account** (after seeding): `demo@expensetracker.pro` / `Demo@1234`

---

## Features

- **Dashboard** — animated balance hero, income/expense/savings counters, monthly & weekly overviews, category donut, budget progress, recent transactions, upcoming bills, top categories, spending calendar, savings goals, quick-add.
- **Expenses & income** — full CRUD with search, filters (category, status, currency, payment method, date range), sort and pagination; receipt upload with client-side image compression.
- **Transactions** — unified history across both ledgers (SQL view with `security_invoker`).
- **Categories** — 13 defaults seeded per user; custom categories with color, icon and optional budget limit.
- **Budgets** — monthly/yearly, overall or per-category, with warning thresholds, progress bars and in-app alerts raised server-side after expense mutations.
- **Analytics** — daily/weekly/monthly/yearly views; income vs expense, savings trend, spend trend and category breakdown; every chart exports to PNG.
- **Reports** — statement for any period exported to **PDF, Excel, CSV** plus a print view.
- **Global search & command palette** — `Ctrl/⌘ K`; searches description, notes, sub-category, amount and date; quick actions and page navigation.
- **Settings** — profile (photo, name, password), preferences (currency, language, theme, notifications), data (JSON backup, CSV import, delete account), activity log (DB audit triggers).
- **Extras** — recurring rules (bills/salary), financial goals, keyboard shortcuts (`g d`, `g e`, `n e`, …), PWA manifest + offline service worker, custom 404 & error boundary.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, RSC, Server Actions, `proxy.ts`) |
| Language | TypeScript (strict, no `any`) |
| UI | Tailwind CSS 4, shadcn/ui (radix), Framer Motion, Lucide, Sonner |
| Forms | React Hook Form + Zod (schemas shared client/server, translated messages) |
| Server state | TanStack Query (palette search), RSC data fetching elsewhere |
| Charts | Recharts 3 |
| i18n | next-intl 4 (cookie locale, no URL prefix → instant switch, RTL) |
| Backend | Supabase (Postgres, Auth, Storage, RLS) |
| Tests | Vitest |

## Design system — “ledger & banknote”

The identity draws from banknote engraving and ledger paper:

- **Signature**: a fine-line **guilloché** motif (the engraving pattern on currency) on the balance hero, auth panel and landing hero; every monetary figure renders as a **ledger numeral** (tabular mono via `Spline Sans Mono`).
- **Palette**: pine ink `#0D1F1A`, banyan green `#177154`, marigold `#D98E2B`, madder rose `#BE4A5A` on near-neutral paper `#F7F8F6`; income is always green, expense always rose.
- **Type**: Instrument Sans (UI) · Fraunces (display) · Spline Sans Mono (amounts) · Noto Nastaliq Urdu (Urdu locale).
- **Chart colors**: both light and dark categorical palettes were validated for colour-vision-deficiency separation (worst adjacent ΔE ≥ 16) and surface contrast; the marigold slot relies on direct labels/tooltips as its contrast relief.

## Getting started

### Prerequisites

- Node.js **22+** recommended (20 works; supabase-js prints a deprecation warning)
- A [Supabase](https://supabase.com) project (free tier is fine)

### 1. Install

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [database.new](https://database.new).
2. In the SQL editor, run the migrations **in order**:
   - `supabase/migrations/0001_schema.sql` — enums, tables, `transactions` view, triggers (new-user bootstrap, audit log, `updated_at`), currencies reference data, storage buckets.
   - `supabase/migrations/0002_rls.sql` — Row Level Security on every table + storage policies.
3. (Optional but recommended) run `supabase/seed.sql` to create the demo user and ~3 months of sample data.
4. **Auth → URL Configuration**: set *Site URL* to your app URL and add `http://localhost:3000/auth/callback` (and the production equivalent) to *Redirect URLs*.
5. **Google OAuth**: Auth → Providers → Google → enable, and paste the client ID/secret from a Google Cloud OAuth consent app whose redirect URI is `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`.

Using the Supabase CLI instead? `supabase db reset` applies migrations and `seed.sql` automatically.

### 3. Environment

```bash
cp .env.example .env.local
```

Fill in from **Project Settings → API**:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/publishable key (public, RLS-guarded) |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only; needed for account deletion |
| `NEXT_PUBLIC_SITE_URL` | absolute URL used in auth email links |

### 4. Run

```bash
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest (currency math, zod schemas)
```

## Deploying to Vercel

1. Push the repo to GitHub/GitLab and **Import Project** in Vercel — the Next.js preset needs no extra configuration.
2. Add the four environment variables above (Settings → Environment Variables). Set `NEXT_PUBLIC_SITE_URL` to the production URL (e.g. `https://expenses.example.com`).
3. Deploy. Then update Supabase **Auth → URL Configuration** so *Site URL* and *Redirect URLs* include `https://YOUR-DOMAIN/auth/callback`.
4. Re-deploy after any env change. That's it — migrations run against Supabase, not Vercel, so no build hooks are required.

## Architecture notes

```
app/                 # App Router: (auth) pages, (app) protected shell, api routes
  (app)/             # dashboard, expenses, income, transactions, categories,
                     # budgets, analytics, reports, settings, profile
actions/             # Server Actions (Zod-validated mutations, budget alerts)
components/          # ui/ (shadcn), layout/ (shell), feature folders
hooks/ lib/          # currency engine, exporters, validators, supabase clients
i18n/ messages/      # next-intl config + en/ur catalogs
supabase/            # migrations + seed
proxy.ts             # session refresh + protected routes (Next 16 middleware)
tests/               # vitest unit tests + demo credentials
```

- **Multi-currency**: amounts are stored with their own currency; the server aggregates into per-currency “money bags” and the client converts with rates from the `currencies` table (1 USD ≈ 278 PKR by default — update `currencies.rate_to_usd` to re-rate). Switching the display currency recalculates every figure instantly with no refetch.
- **i18n**: locale lives in a cookie (`ETP_LOCALE`) mirrored to `settings.locale`; switching re-renders the RSC tree in place (no full reload) and flips `<html dir>` for RTL.
- **Security**: RLS restricts every user-scoped table to `auth.uid()`; the `transactions` view runs with `security_invoker`; storage paths are scoped per-user; all mutations re-validate with Zod on the server; the service-role key never reaches the client.
- **Ledger design**: `expenses` and `income` are twin tables; `transactions` is a `UNION ALL` view for the unified history, filters and reports.
- **Notifications**: after each expense mutation the server re-evaluates budgets and inserts at most one `budget_alert` per budget per period.

## Testing

`npm test` runs Vitest suites covering the currency engine (conversion, rounding, mixed-currency sums, formatting) and the shared Zod schemas (amounts, dates, thresholds, auth flows). Demo credentials for manual/E2E testing live in `tests/demo-credentials.ts`.

## License

Private project — all rights reserved.
