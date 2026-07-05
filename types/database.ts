/**
 * Hand-maintained Supabase database types.
 * Regenerate with `supabase gen types typescript` once linked to a project,
 * keeping the public shape identical.
 */

export type CurrencyCode = "USD" | "PKR";
export type CategoryKind = "expense" | "income" | "both";
export type TransactionStatus = "cleared" | "pending" | "scheduled";
export type BudgetPeriod = "monthly" | "yearly";
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type AccountType = "cash" | "bank" | "card" | "mobile_wallet" | "other";
export type PaymentKind =
  | "cash"
  | "card"
  | "bank_transfer"
  | "mobile_wallet"
  | "cheque"
  | "other";
export type NotificationType =
  | "budget_alert"
  | "payment_reminder"
  | "monthly_summary"
  | "daily_reminder"
  | "system";
export type TransactionType = "expense" | "income";
export type Locale = "en" | "ur";
export type ThemePreference = "light" | "dark" | "system";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type Settings = {
  user_id: string;
  currency: CurrencyCode;
  locale: Locale;
  theme: ThemePreference;
  notify_budget_alerts: boolean;
  notify_monthly_summary: boolean;
  notify_payment_reminders: boolean;
  notify_daily_reminder: boolean;
  updated_at: string;
}

export type Currency = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimals: number;
  rate_to_usd: number;
}

export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  is_default: boolean;
  created_at: string;
}

export type PaymentMethod = {
  id: string;
  user_id: string;
  name: string;
  kind: PaymentKind;
  is_default: boolean;
  created_at: string;
}

export type Category = {
  id: string;
  user_id: string;
  name: string;
  kind: CategoryKind;
  color: string;
  icon: string;
  budget_limit: number | null;
  is_default: boolean;
  created_at: string;
}

/** Shared shape of the `expenses` and `income` ledgers. */
export type LedgerEntry = {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  payment_method_id: string | null;
  amount: number;
  currency: CurrencyCode;
  sub_category: string | null;
  description: string;
  notes: string | null;
  occurred_on: string;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
}

/** Row of the unified `transactions` view. */
export type Transaction = Omit<LedgerEntry, "account_id"> & {
  type: TransactionType;
  account_id: string | null;
};

export type Budget = {
  id: string;
  user_id: string;
  name: string;
  category_id: string | null;
  period: BudgetPeriod;
  amount: number;
  currency: CurrencyCode;
  alert_threshold: number;
  starts_on: string;
  created_at: string;
}

export type Attachment = {
  id: string;
  user_id: string;
  expense_id: string | null;
  income_id: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export type RecurringRule = {
  id: string;
  user_id: string;
  kind: TransactionType;
  description: string;
  amount: number;
  currency: CurrencyCode;
  category_id: string | null;
  payment_method_id: string | null;
  frequency: RecurringFrequency;
  next_run_on: string;
  end_on: string | null;
  active: boolean;
  created_at: string;
}

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  currency: CurrencyCode;
  due_on: string | null;
  color: string;
  created_at: string;
}

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

export type AuditLog = {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

type TableOf<Row, Optional extends keyof Row = never> = {
  Row: Row;
  Insert: Omit<Row, Optional> & Partial<Pick<Row, Optional>>;
  Update: Partial<Row>;
  Relationships: [];
};

/** Supabase client Database generic. */
export type Database = {
  public: {
    Tables: {
      profiles: TableOf<Profile, "created_at" | "updated_at" | "full_name" | "avatar_url">;
      settings: TableOf<Settings, "updated_at" | "currency" | "locale" | "theme" | "notify_budget_alerts" | "notify_monthly_summary" | "notify_payment_reminders" | "notify_daily_reminder">;
      currencies: TableOf<Currency, "decimals">;
      accounts: TableOf<Account, "id" | "created_at" | "type" | "currency" | "is_default">;
      payment_methods: TableOf<PaymentMethod, "id" | "created_at" | "kind" | "is_default">;
      categories: TableOf<Category, "id" | "created_at" | "kind" | "color" | "icon" | "budget_limit" | "is_default">;
      expenses: TableOf<LedgerEntry, "id" | "created_at" | "updated_at" | "account_id" | "category_id" | "payment_method_id" | "sub_category" | "notes" | "status" | "currency" | "occurred_on">;
      income: TableOf<LedgerEntry, "id" | "created_at" | "updated_at" | "account_id" | "category_id" | "payment_method_id" | "sub_category" | "notes" | "status" | "currency" | "occurred_on">;
      budgets: TableOf<Budget, "id" | "created_at" | "category_id" | "period" | "currency" | "alert_threshold" | "starts_on">;
      attachments: TableOf<Attachment, "id" | "created_at" | "expense_id" | "income_id" | "size_bytes">;
      recurring_rules: TableOf<RecurringRule, "id" | "created_at" | "category_id" | "payment_method_id" | "frequency" | "end_on" | "active" | "currency">;
      goals: TableOf<Goal, "id" | "created_at" | "saved_amount" | "due_on" | "color" | "currency">;
      notifications: TableOf<AppNotification, "id" | "created_at" | "read" | "body" | "type">;
      audit_logs: TableOf<AuditLog, "id" | "created_at" | "entity_id" | "details">;
    };
    Views: {
      transactions: { Row: Transaction; Relationships: [] };
    };
    Functions: Record<string, never>;
    Enums: {
      currency_code: CurrencyCode;
      category_kind: CategoryKind;
      transaction_status: TransactionStatus;
      budget_period: BudgetPeriod;
      recurring_frequency: RecurringFrequency;
      account_type: AccountType;
      payment_kind: PaymentKind;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
}
