import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Full JSON backup of every row the caller owns (RLS-scoped). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [profile, settings, accounts, paymentMethods, categories, expenses, income, budgets, recurring, goals, notifications] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("settings").select("*").eq("user_id", user.id).single(),
      supabase.from("accounts").select("*").eq("user_id", user.id),
      supabase.from("payment_methods").select("*").eq("user_id", user.id),
      supabase.from("categories").select("*").eq("user_id", user.id),
      supabase.from("expenses").select("*").eq("user_id", user.id),
      supabase.from("income").select("*").eq("user_id", user.id),
      supabase.from("budgets").select("*").eq("user_id", user.id),
      supabase.from("recurring_rules").select("*").eq("user_id", user.id),
      supabase.from("goals").select("*").eq("user_id", user.id),
      supabase.from("notifications").select("*").eq("user_id", user.id),
    ]);

  const backup = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    settings: settings.data,
    accounts: accounts.data,
    payment_methods: paymentMethods.data,
    categories: categories.data,
    expenses: expenses.data,
    income: income.data,
    budgets: budgets.data,
    recurring_rules: recurring.data,
    goals: goals.data,
    notifications: notifications.data,
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="expense-tracker-backup.json"`,
    },
  });
}
