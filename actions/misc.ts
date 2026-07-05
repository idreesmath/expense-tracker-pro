"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  makeGoalSchema,
  makeRecurringSchema,
  makeLedgerEntrySchema,
  type GoalInput,
  type RecurringInput,
} from "@/lib/validations";
import type { ActionResult } from "./types";

// ---------------- Goals ----------------

export async function createGoal(input: GoalInput): Promise<ActionResult> {
  const parsed = makeGoalSchema().safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { error } = await supabase
    .from("goals")
    .insert({ ...parsed.data, user_id: user.id });
  if (error) return { ok: false, error: "common.error" };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateGoalSaved(
  id: string,
  saved_amount: number
): Promise<ActionResult> {
  if (!(saved_amount >= 0)) return { ok: false, error: "common.error" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { error } = await supabase
    .from("goals")
    .update({ saved_amount })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "common.error" };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "common.error" };

  revalidatePath("/dashboard");
  return { ok: true };
}

// ---------------- Recurring rules ----------------

export async function createRecurring(input: RecurringInput): Promise<ActionResult> {
  const parsed = makeRecurringSchema().safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { error } = await supabase
    .from("recurring_rules")
    .insert({ ...parsed.data, user_id: user.id });
  if (error) return { ok: false, error: "common.error" };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteRecurring(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { error } = await supabase
    .from("recurring_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "common.error" };

  revalidatePath("/dashboard");
  return { ok: true };
}

// ---------------- Notifications ----------------

export async function markNotificationRead(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------------- CSV import ----------------

export async function importExpensesCsv(
  rows: Array<{
    occurred_on: string;
    description: string;
    amount: number;
    currency: string;
    category?: string;
  }>
): Promise<ActionResult<{ count: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", user.id);
  const byName = new Map(
    (categories ?? []).map((c) => [c.name.toLowerCase(), c.id])
  );

  const schema = makeLedgerEntrySchema();
  const inserts = [];
  for (const row of rows.slice(0, 500)) {
    const parsed = schema.safeParse({
      amount: row.amount,
      currency: row.currency === "PKR" ? "PKR" : "USD",
      description: row.description,
      occurred_on: row.occurred_on,
      status: "cleared",
      category_id: row.category
        ? (byName.get(row.category.toLowerCase()) ?? null)
        : null,
    });
    if (parsed.success) inserts.push({ ...parsed.data, user_id: user.id });
  }
  if (!inserts.length) return { ok: false, error: "common.error" };

  const { error } = await supabase.from("expenses").insert(inserts);
  if (error) return { ok: false, error: "common.error" };

  revalidatePath("/", "layout");
  return { ok: true, data: { count: inserts.length } };
}

// ---------------- Account deletion ----------------

/**
 * Deletes the auth user via the service-role client; every owned row
 * follows through ON DELETE CASCADE. Requires SUPABASE_SERVICE_ROLE_KEY.
 */
export async function deleteAccount(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: "common.error" };

  await supabase.auth.signOut();
  redirect("/");
}
