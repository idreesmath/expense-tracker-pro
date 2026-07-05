"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  makeForgotSchema,
  makeLoginSchema,
  makeRegisterSchema,
  makeResetSchema,
} from "@/lib/validations";
import type { ActionResult } from "./types";

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export async function signIn(input: {
  email: string;
  password: string;
}): Promise<ActionResult> {
  const parsed = makeLoginSchema().safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: "auth.invalidCredentials" };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(input: {
  full_name: string;
  email: string;
  password: string;
  confirm: string;
}): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const parsed = makeRegisterSchema().safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${siteUrl()}/auth/callback`,
    },
  });
  if (error) return { ok: false, error: "common.error" };

  // When email confirmation is enabled the session is null until confirmed.
  if (!data.session) return { ok: true, data: { needsConfirmation: true } };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signInWithGoogle(): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl()}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error || !data.url) return { ok: false, error: "common.error" };
  redirect(data.url);
}

export async function forgotPassword(input: { email: string }): Promise<ActionResult> {
  const parsed = makeForgotSchema().safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation.invalidEmail" };

  const supabase = await createClient();
  // Always report success so the form can't be used to probe accounts.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
  });
  return { ok: true };
}

export async function resetPassword(input: {
  password: string;
  confirm: string;
}): Promise<ActionResult> {
  const parsed = makeResetSchema().safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation.passwordMin" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: "common.error" };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
