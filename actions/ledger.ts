"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { makeLedgerEntrySchema, type LedgerEntryInput } from "@/lib/validations";
import { convert, type RateMap } from "@/lib/currency";
import type { CurrencyCode, TransactionType } from "@/types/database";
import type { ActionResult } from "./types";

const TABLE: Record<TransactionType, "expenses" | "income"> = {
  expense: "expenses",
  income: "income",
};

function refreshLedgerPaths() {
  for (const p of ["/dashboard", "/expenses", "/income", "/transactions", "/analytics", "/reports", "/budgets"]) {
    revalidatePath(p);
  }
}

export async function createEntry(
  kind: TransactionType,
  input: LedgerEntryInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = makeLedgerEntrySchema().safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { data, error } = await supabase
    .from(TABLE[kind])
    .insert({ ...parsed.data, user_id: user.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "common.error" };

  if (kind === "expense") await checkBudgets(user.id);
  refreshLedgerPaths();
  return { ok: true, data: { id: data.id } };
}

export async function updateEntry(
  kind: TransactionType,
  id: string,
  input: LedgerEntryInput
): Promise<ActionResult> {
  const parsed = makeLedgerEntrySchema().safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { error } = await supabase
    .from(TABLE[kind])
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "common.error" };

  if (kind === "expense") await checkBudgets(user.id);
  refreshLedgerPaths();
  return { ok: true };
}

export async function deleteEntry(
  kind: TransactionType,
  id: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { error } = await supabase
    .from(TABLE[kind])
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "common.error" };

  refreshLedgerPaths();
  return { ok: true };
}

/**
 * After expense mutations, re-evaluate every budget for the current
 * period and raise at most one alert per budget per month.
 */
async function checkBudgets(userId: string): Promise<void> {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("settings")
    .select("notify_budget_alerts")
    .eq("user_id", userId)
    .single();
  if (!settings?.notify_budget_alerts) return;

  const [{ data: budgets }, { data: currencies }] = await Promise.all([
    supabase.from("budgets").select("*").eq("user_id", userId),
    supabase.from("currencies").select("*"),
  ]);
  if (!budgets?.length || !currencies) return;

  const rates = Object.fromEntries(
    currencies.map((c) => [c.code, Number(c.rate_to_usd)])
  ) as RateMap;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);

  for (const budget of budgets) {
    const from = budget.period === "monthly" ? monthStart : yearStart;
    let query = supabase
      .from("expenses")
      .select("amount, currency")
      .eq("user_id", userId)
      .gte("occurred_on", from);
    if (budget.category_id) query = query.eq("category_id", budget.category_id);

    const { data: rows } = await query;
    if (!rows) continue;

    const spent = rows.reduce(
      (acc, r) =>
        acc +
        convert(Number(r.amount), r.currency as CurrencyCode, budget.currency, rates),
      0
    );
    const pct = (spent / Number(budget.amount)) * 100;
    if (pct < budget.alert_threshold) continue;

    // One alert per budget per period start.
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "budget_alert")
      .gte("created_at", from)
      .ilike("title", `%${budget.name}%`)
      .limit(1);
    if (existing?.length) continue;

    const exceeded = pct >= 100;
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "budget_alert",
      title: exceeded
        ? `Budget exceeded: ${budget.name}`
        : `Approaching budget: ${budget.name}`,
      body: `${Math.round(pct)}% of ${budget.currency} ${budget.amount} used.`,
    });
  }
}
