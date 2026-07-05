# Expense Tracker Pro — Requirements & Build Specification

A production-ready, multi-currency, bilingual personal & small-business finance application, optimized for deployment on Vercel.

---

## 1. Role & Objective

You are acting simultaneously as a **Senior Full-Stack Engineer**, **UI/UX Designer**, **Database Architect**, and **DevOps Engineer**.

Build a complete, production-ready **Expense Tracker Web Application** using current, non-deprecated technologies. The result must be deployable on Vercel with minimal configuration, follow clean and modular architecture, and present a premium interface comparable to Notion, Linear, the Stripe Dashboard, the Vercel Dashboard, and shadcn/ui.

> **Version note:** The stack below reflects intended framework generations. Before scaffolding, verify the latest stable release of each core dependency (Next.js, React, Supabase client libraries) and pin exact versions in `package.json`. Do not use deprecated or preview APIs.

---

## 2. Technology Stack

**Frontend**

- Next.js (App Router only)
- React
- TypeScript (strict mode, typed everywhere)
- Tailwind CSS
- shadcn/ui
- Framer Motion (animations)
- React Hook Form + Zod (forms & validation)
- TanStack Query / React Query (server state & caching)

**Backend**

- Next.js Server Actions
- Next.js Route Handlers (API routes) where server actions are not appropriate
- Supabase (client + server SDK)

**Database**

- Supabase PostgreSQL

**Authentication**

- Supabase Auth
- Email + password login
- Google OAuth login
- Password reset flow

**Supporting Libraries**

- Charts: Recharts
- Icons: Lucide React
- Toasts / notifications: Sonner
- Date handling: date-fns
- Internationalization: next-intl

**Deployment**

- Vercel

---

## 3. Core Product Requirements

### 3.1 Multi-Currency

- Support two currencies: **US Dollar (USD, $)** and **Pakistani Rupee (PKR, ₨)**.
- Users can switch currency at any time; the selection persists in settings.
- All balances, totals, and analytics recalculate automatically on switch.
- Store the display currency preference per user; store monetary amounts with an explicit currency field so records remain unambiguous.

### 3.2 Bilingual Interface (i18n)

- Support **English** and **Urdu**.
- Language switches instantly with no full reload.
- All UI strings are translatable (no hardcoded copy) via next-intl message catalogs.
- Automatically apply **RTL layout** when Urdu is active, including mirrored components, icons, and charts where appropriate.

### 3.3 Theming

- Support **Light**, **Dark**, and **System** themes.
- System theme auto-detects and follows OS preference.
- Theme switcher lives in the navbar.
- Use smooth, non-jarring transitions between themes.

### 3.4 Responsive Design

- Fully responsive and tested across **desktop, laptop, tablet, and mobile** breakpoints.
- Layouts adapt (collapsible sidebar, stacked cards, mobile navigation) rather than merely scaling down.

---

## 4. Feature Modules

### 4.1 Dashboard

A premium overview screen built from animated cards and widgets, including:

- Welcome card, total balance, total income, total expenses, total savings
- Monthly overview and weekly overview
- Expense analytics and income analytics
- Category-wise pie chart and monthly bar chart
- Recent transactions and budget progress
- Quick-add expense and quick-add income
- Upcoming bills, monthly budget status, top categories, and a mini calendar
- Animated counters and loading skeletons for all data-backed widgets

### 4.2 Expense Management

Full CRUD plus search, filter, and sort. Each expense record includes:

- Amount, currency, category, sub-category
- Description, notes, payment method
- Date, attachment (receipt), status

### 4.3 Income Management

Identical capabilities and field structure to expenses, scoped to income.

### 4.4 Categories

- Ship default categories: Food, Transport, Shopping, Medical, Education, Bills, Entertainment, Travel, Business, Salary, Investment, Gift, Other.
- Users can create custom categories.
- Each category carries a **color**, an **icon**, and an optional **budget limit**.

### 4.5 Budgets

- Create monthly, yearly, and per-category budgets.
- Show progress bars, remaining budget, and exceeded-budget warnings.
- Trigger budget alerts and notifications when thresholds are crossed.

### 4.6 Analytics

A dedicated analytics page with:

- Daily, weekly, monthly, and yearly expense views
- Income vs. expense comparison and a savings graph
- Pie, area, bar, and line charts
- Chart export

### 4.7 Reports

- Generate reports as **PDF, Excel, and CSV**, plus a print-friendly view.

### 4.8 Transactions

- Complete unified transaction history.
- Filters: date, category, amount, currency, payment method, status.
- In-list search and pagination.

### 4.9 Global Search & Command Palette

- Global search across category, description, amount, date, and notes.
- Keyboard-driven command palette / search modal.

### 4.10 Settings

- **Profile:** photo, name, email, password.
- **Preferences:** currency, language, theme, notification settings.
- **Data:** export data, delete account.

### 4.11 Notifications

- Budget-exceeded alerts, monthly reminders, payment reminders, daily expense reminders.
- Surface via Sonner toasts and a persistent notifications store.

---

## 5. Additional Features

- Recurring expenses and recurring income
- Upcoming bills
- Financial goals and savings goals
- Expense calendar view
- Notes and receipt upload with client-side image compression
- Import / export CSV; backup and restore
- Activity / audit log
- Keyboard shortcuts
- PWA support with basic offline capability

---

## 6. Pages

Landing, Login, Register, Forgot Password, Dashboard, Income, Expenses, Transactions, Categories, Budgets, Analytics, Reports, Settings, Profile, and a custom 404.

---

## 7. UI / UX Standards

Design should feel minimal yet premium — reference the Stripe Dashboard, Vercel Dashboard, Notion, Linear, TailAdmin, Tremor, and shadcn admin patterns.

Employ, where they serve the design rather than as decoration:

- Rounded cards, soft shadows, and tasteful glassmorphism
- Smooth animations, hover effects, and gradient accents
- Loading skeletons and animated counters
- Modern collapsible sidebar, sticky header, breadcrumbs, profile dropdown
- Floating action button and quick actions
- Command palette and search modal

---

## 8. Database Design (Supabase / PostgreSQL)

**Tables:** `profiles`, `accounts`, `currencies`, `categories`, `budgets`, `income`, `expenses`, `transactions`, `payment_methods`, `attachments`, `notifications`, `settings`, `audit_logs`.

**Core relationships:**

- One user → many accounts
- One account → many transactions (income & expenses)
- Transactions reference categories, payment methods, and (optionally) attachments
- Categories → many budgets

Deliver SQL migration files, seed data, and sample users.

---

## 9. Security

- Enable **Row Level Security** on every user-scoped table, with policies that restrict rows to their owner.
- JWT-based auth via Supabase; protected routes enforced by middleware.
- Server-side validation on all mutations (Zod), CSRF-safe patterns, and secured API surfaces.
- All secrets in environment variables; provide a `.env.example`.

---

## 10. Performance

Use React Server Components, streaming and Suspense, lazy loading, code splitting, image optimization, caching, and pagination throughout.

---

## 11. Accessibility

Full keyboard navigation, meaningful ARIA labels, visible focus states, and screen-reader support. RTL must remain accessible.

---

## 12. Folder Structure (scalable, illustrative)

```
app/
components/
hooks/
lib/
services/
actions/
store/
types/
utils/
styles/
public/
supabase/
middleware.ts
```

---

## 13. Code Quality Requirements

- TypeScript everywhere with strong typing; no `any` escape hatches.
- App Router only; no deprecated Next.js APIs.
- Follow SOLID principles and favor reusable, composable components.
- No unnecessary duplication; modular, maintainable, scalable architecture.
- SEO-optimized, fast-loading, fully responsive.
- Error boundaries, Suspense support, and proper loading skeletons.
- Clean, meaningful comments and documentation.

---

## 14. Deliverables

- Complete project architecture and folder structure
- Database schema, SQL migrations, and Supabase RLS policies
- Authentication (email, Google, password reset)
- Responsive UI, dashboard, and interactive charts
- CRUD operations, API routes, and server actions
- Reusable components, form validation, loading states, error handling, toasts
- Vercel deployment guide
- `README.md`, `.env.example`, seed data, and sample users
- Unit testing setup with sample username/email and password for demo purpose
- Production-ready, well-commented, best-practice code

---

## 15. Suggested Build Phases

1. **Foundation** — scaffold Next.js + TypeScript + Tailwind + shadcn/ui; configure theming and i18n shells.
2. **Data layer** — Supabase project, schema, migrations, RLS policies, seed data.
3. **Auth** — email/password, Google OAuth, password reset, protected routes and middleware.
4. **Core CRUD** — expenses, income, categories, payment methods.
5. **Budgets & analytics** — budget logic, charts, analytics page.
6. **Dashboard & transactions** — widgets, unified history, global search, command palette.
7. **Reports, notifications, extras** — exports, recurring items, goals, calendar, PWA.
8. **Polish & ship** — accessibility pass, animations, skeletons, tests, deployment guide.

---

## 16. Acceptance Criteria

- App builds and deploys to Vercel with no deprecated-API warnings.
- Switching currency, language (with RTL), and theme all work live and persist per user.
- A logged-in user can only ever read or write their own rows (verified against RLS).
- All monetary math is currency-aware and correct across USD and PKR.
- All screens are usable at mobile, tablet, and desktop widths.
- Forms validate on client and server; failures surface clear, translated messages.
- Reports export correctly to PDF, Excel, and CSV.

---

## 17. Non-Goals (out of scope unless later requested)

- Real bank / payment-gateway integrations and live exchange-rate feeds
- Multi-user shared accounts or team roles
- Native mobile apps (PWA only)
- Currencies beyond USD and PKR
