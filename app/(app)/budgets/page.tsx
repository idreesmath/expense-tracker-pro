import { redirect } from "next/navigation";
import { format, startOfMonth, startOfYear } from "date-fns";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { bagFromRows } from "@/lib/aggregate";
import { PageHeader } from "@/components/page-header";
import { BudgetsView } from "@/components/budgets/budgets-view";
import type { CurrencyCode } from "@/types/database";
import type { MoneyBag } from "@/lib/aggregate";

export const metadata = { title: "Budgets" };

export default async function BudgetsPage() {
  const t = await getTranslations("budgets");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date();
  const yearStart = format(startOfYear(today), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");

  const [{ data: budgets }, { data: expenses }] = await Promise.all([
    supabase.from("budgets").select("*").eq("user_id", user.id).order("created_at"),
    supabase
      .from("expenses")
      .select("amount, currency, occurred_on, category_id")
      .eq("user_id", user.id)
      .gte("occurred_on", yearStart),
  ]);

  const spend: Record<string, MoneyBag> = {};
  for (const budget of budgets ?? []) {
    const from = budget.period === "monthly" ? monthStart : yearStart;
    const rows = (expenses ?? []).filter(
      (r) =>
        r.occurred_on >= from &&
        (!budget.category_id || r.category_id === budget.category_id)
    );
    spend[budget.id] = bagFromRows(
      rows.map((r) => ({ amount: r.amount, currency: r.currency as CurrencyCode }))
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <BudgetsView budgets={budgets ?? []} spend={spend} />
    </div>
  );
}
