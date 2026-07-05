import { redirect } from "next/navigation";
import { addDays, format, startOfMonth, subMonths } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { bagFromRows, emptyBag, addToBag, type MoneyBag } from "@/lib/aggregate";
import { DashboardView, type DashboardData } from "@/components/dashboard/dashboard-view";
import type { CurrencyCode } from "@/types/database";

export const metadata = { title: "Dashboard" };

/** Gathers every widget's data in one round of parallel queries. */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date();
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const sixMonthsAgo = format(startOfMonth(subMonths(today, 5)), "yyyy-MM-dd");
  const weekAgo = format(addDays(today, -6), "yyyy-MM-dd");
  const monthAhead = format(addDays(today, 30), "yyyy-MM-dd");

  const [
    { data: expenses6m },
    { data: income6m },
    { data: allExpenses },
    { data: allIncome },
    { data: budgets },
    { data: recent },
    { data: bills },
    { data: goals },
    { data: categories },
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select("amount, currency, occurred_on, category_id")
      .eq("user_id", user.id)
      .gte("occurred_on", sixMonthsAgo),
    supabase
      .from("income")
      .select("amount, currency, occurred_on")
      .eq("user_id", user.id)
      .gte("occurred_on", sixMonthsAgo),
    supabase.from("expenses").select("amount, currency").eq("user_id", user.id),
    supabase.from("income").select("amount, currency").eq("user_id", user.id),
    supabase.from("budgets").select("*").eq("user_id", user.id).order("created_at"),
    supabase
      .from("transactions")
      .select("*")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("recurring_rules")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true)
      .lte("next_run_on", monthAhead)
      .order("next_run_on")
      .limit(6),
    supabase.from("goals").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("categories").select("id, name, color, icon, is_default").eq("user_id", user.id),
  ]);

  // ---- aggregate on the server; convert on the client -------------
  const monthlyExpenses = (expenses6m ?? []).filter((r) => r.occurred_on >= monthStart);
  const monthlyIncome = (income6m ?? []).filter((r) => r.occurred_on >= monthStart);

  const months: DashboardData["months"] = [];
  for (let i = 5; i >= 0; i--) {
    const key = format(subMonths(today, i), "yyyy-MM");
    months.push({ month: key, income: emptyBag(), expense: emptyBag() });
  }
  const monthIndex = new Map(months.map((m, i) => [m.month, i]));
  for (const row of expenses6m ?? []) {
    const idx = monthIndex.get(row.occurred_on.slice(0, 7));
    if (idx !== undefined)
      addToBag(months[idx].expense, Number(row.amount), row.currency as CurrencyCode);
  }
  for (const row of income6m ?? []) {
    const idx = monthIndex.get(row.occurred_on.slice(0, 7));
    if (idx !== undefined)
      addToBag(months[idx].income, Number(row.amount), row.currency as CurrencyCode);
  }

  const week: DashboardData["week"] = [];
  for (let i = 6; i >= 0; i--) {
    const day = format(addDays(today, -i), "yyyy-MM-dd");
    week.push({ day, expense: emptyBag() });
  }
  const weekIndex = new Map(week.map((d, i) => [d.day, i]));
  for (const row of expenses6m ?? []) {
    if (row.occurred_on < weekAgo) continue;
    const idx = weekIndex.get(row.occurred_on);
    if (idx !== undefined)
      addToBag(week[idx].expense, Number(row.amount), row.currency as CurrencyCode);
  }

  const byCategory = new Map<string, MoneyBag>();
  for (const row of monthlyExpenses) {
    const key = row.category_id ?? "uncategorized";
    const bag = byCategory.get(key) ?? emptyBag();
    addToBag(bag, Number(row.amount), row.currency as CurrencyCode);
    byCategory.set(key, bag);
  }

  const budgetSpend: DashboardData["budgetSpend"] = {};
  for (const budget of budgets ?? []) {
    const from =
      budget.period === "monthly"
        ? monthStart
        : `${today.getFullYear()}-01-01`;
    const rows = (expenses6m ?? []).filter(
      (r) =>
        r.occurred_on >= from &&
        (!budget.category_id || r.category_id === budget.category_id)
    );
    budgetSpend[budget.id] = bagFromRows(
      rows.map((r) => ({ amount: r.amount, currency: r.currency as CurrencyCode }))
    );
  }

  const calendar: DashboardData["calendar"] = {};
  for (const row of expenses6m ?? []) {
    if (row.occurred_on < monthStart) continue;
    calendar[row.occurred_on] = addToBag(
      calendar[row.occurred_on] ?? emptyBag(),
      Number(row.amount),
      row.currency as CurrencyCode
    );
  }

  const data: DashboardData = {
    totals: {
      income: bagFromRows((allIncome ?? []) as never),
      expense: bagFromRows((allExpenses ?? []) as never),
      monthIncome: bagFromRows(monthlyIncome as never),
      monthExpense: bagFromRows(monthlyExpenses as never),
    },
    months,
    week,
    categorySpend: [...byCategory.entries()].map(([categoryId, bag]) => ({
      categoryId,
      bag,
    })),
    budgets: budgets ?? [],
    budgetSpend,
    recent: recent ?? [],
    bills: bills ?? [],
    goals: goals ?? [],
    categories: categories ?? [],
    calendar,
  };

  return <DashboardView data={data} />;
}
