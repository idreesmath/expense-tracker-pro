"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { makeBudgetSchema, type BudgetInput } from "@/lib/validations";
import type { ActionResult } from "./types";

function refresh() {
  for (const p of ["/budgets", "/dashboard"]) revalidatePath(p);
}

export async function createBudget(input: BudgetInput): Promise<ActionResult> {
  const parsed = makeBudgetSchema().safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { error } = await supabase
    .from("budgets")
    .insert({ ...parsed.data, user_id: user.id });
  if (error) return { ok: false, error: "common.error" };

  refresh();
  return { ok: true };
}

export async function updateBudget(
  id: string,
  input: BudgetInput
): Promise<ActionResult> {
  const parsed = makeBudgetSchema().safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { error } = await supabase
    .from("budgets")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "common.error" };

  refresh();
  return { ok: true };
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "common.error" };

  refresh();
  return { ok: true };
}
