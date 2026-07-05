import { z } from "zod";

/**
 * Zod schemas shared by client forms and server actions.
 *
 * Every factory takes a translator for the `validation` namespace so
 * failure messages surface in the active language on both sides.
 * Tests and server fallbacks can pass the identity function.
 */
export type Translate = (key: string) => string;
const id: Translate = (k) => k;

export const CURRENCY_CODES = ["USD", "PKR"] as const;
export const STATUSES = ["cleared", "pending", "scheduled"] as const;
export const CATEGORY_KINDS = ["expense", "income", "both"] as const;
export const BUDGET_PERIODS = ["monthly", "yearly"] as const;
export const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;

export const MAX_AMOUNT = 999_999_999;
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
export const RECEIPT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function makeAmountSchema(t: Translate = id) {
  return z.coerce
    .number<number>()
    .positive(t("amountPositive"))
    .max(MAX_AMOUNT, t("amountMax"));
}

/** Expense and income rows share one shape. */
export function makeLedgerEntrySchema(t: Translate = id) {
  return z.object({
    amount: makeAmountSchema(t),
    currency: z.enum(CURRENCY_CODES),
    category_id: z.uuid().nullable().optional(),
    payment_method_id: z.uuid().nullable().optional(),
    account_id: z.uuid().nullable().optional(),
    sub_category: z.string().max(80).nullable().optional(),
    description: z.string().min(2, t("descriptionMin")).max(200),
    notes: z.string().max(2000).nullable().optional(),
    occurred_on: z.iso.date(t("dateInvalid")),
    status: z.enum(STATUSES),
  });
}
export type LedgerEntryInput = z.infer<ReturnType<typeof makeLedgerEntrySchema>>;

export function makeCategorySchema(t: Translate = id) {
  return z.object({
    name: z.string().min(2, t("nameMin")).max(60),
    kind: z.enum(CATEGORY_KINDS),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    icon: z.string().min(1).max(40),
    budget_limit: z.coerce
      .number<number>()
      .positive(t("amountPositive"))
      .max(MAX_AMOUNT, t("amountMax"))
      .nullable()
      .optional(),
  });
}
export type CategoryInput = z.infer<ReturnType<typeof makeCategorySchema>>;

export function makeBudgetSchema(t: Translate = id) {
  return z.object({
    name: z.string().min(2, t("nameMin")).max(80),
    category_id: z.uuid().nullable().optional(),
    period: z.enum(BUDGET_PERIODS),
    amount: makeAmountSchema(t),
    currency: z.enum(CURRENCY_CODES),
    alert_threshold: z.coerce
      .number<number>()
      .int()
      .min(1, t("thresholdRange"))
      .max(100, t("thresholdRange")),
  });
}
export type BudgetInput = z.infer<ReturnType<typeof makeBudgetSchema>>;

export function makeGoalSchema(t: Translate = id) {
  return z.object({
    name: z.string().min(2, t("nameMin")).max(80),
    target_amount: makeAmountSchema(t),
    saved_amount: z.coerce.number<number>().min(0).max(MAX_AMOUNT).default(0),
    currency: z.enum(CURRENCY_CODES),
    due_on: z.iso.date(t("dateInvalid")).nullable().optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#177154"),
  });
}
export type GoalInput = z.infer<ReturnType<typeof makeGoalSchema>>;

export function makeRecurringSchema(t: Translate = id) {
  return z.object({
    kind: z.enum(["expense", "income"]),
    description: z.string().min(2, t("descriptionMin")).max(200),
    amount: makeAmountSchema(t),
    currency: z.enum(CURRENCY_CODES),
    category_id: z.uuid().nullable().optional(),
    payment_method_id: z.uuid().nullable().optional(),
    frequency: z.enum(FREQUENCIES),
    next_run_on: z.iso.date(t("dateInvalid")),
    end_on: z.iso.date(t("dateInvalid")).nullable().optional(),
  });
}
export type RecurringInput = z.infer<ReturnType<typeof makeRecurringSchema>>;

export function makeLoginSchema(t: Translate = id) {
  return z.object({
    email: z.email(t("invalidEmail")),
    password: z.string().min(8, t("passwordMin")),
  });
}

export function makeRegisterSchema(t: Translate = id) {
  return z
    .object({
      full_name: z.string().min(2, t("nameMin")).max(80),
      email: z.email(t("invalidEmail")),
      password: z.string().min(8, t("passwordMin")),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, {
      message: t("passwordMismatch"),
      path: ["confirm"],
    });
}

export function makeForgotSchema(t: Translate = id) {
  return z.object({ email: z.email(t("invalidEmail")) });
}

export function makeResetSchema(t: Translate = id) {
  return z
    .object({
      password: z.string().min(8, t("passwordMin")),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, {
      message: t("passwordMismatch"),
      path: ["confirm"],
    });
}

export function makeProfileSchema(t: Translate = id) {
  return z.object({
    full_name: z.string().min(2, t("nameMin")).max(80),
  });
}

export const settingsSchema = z.object({
  currency: z.enum(CURRENCY_CODES).optional(),
  locale: z.enum(["en", "ur"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  notify_budget_alerts: z.boolean().optional(),
  notify_monthly_summary: z.boolean().optional(),
  notify_payment_reminders: z.boolean().optional(),
  notify_daily_reminder: z.boolean().optional(),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
