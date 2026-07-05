"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { makeCategorySchema, type CategoryInput } from "@/lib/validations";
import type { ActionResult } from "./types";

function refresh() {
  for (const p of ["/categories", "/dashboard", "/expenses", "/income", "/transactions", "/budgets", "/analytics"]) {
    revalidatePath(p);
  }
}

export async function createCategory(
  input: CategoryInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = makeCategorySchema().safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { data, error } = await supabase
    .from("categories")
    .insert({ ...parsed.data, user_id: user.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "common.error" };

  refresh();
  return { ok: true, data: { id: data.id } };
}

export async function updateCategory(
  id: string,
  input: CategoryInput
): Promise<ActionResult> {
  const parsed = makeCategorySchema().safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { error } = await supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "common.error" };

  refresh();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "common.error" };

  refresh();
  return { ok: true };
}
