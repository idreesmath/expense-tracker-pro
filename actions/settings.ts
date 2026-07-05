"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { settingsSchema, type SettingsInput, makeProfileSchema } from "@/lib/validations";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";
import type { ActionResult } from "./types";

/**
 * Persist preference changes. Locale is mirrored into a cookie so the
 * whole RSC tree re-renders in the new language without a full reload.
 */
export async function updateSettings(input: SettingsInput): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "common.error" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { error } = await supabase
    .from("settings")
    .update(parsed.data)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "common.error" };

  if (parsed.data.locale) {
    const store = await cookies();
    store.set(LOCALE_COOKIE, parsed.data.locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Locale switch for signed-out visitors (landing/auth pages). */
export async function setLocaleCookie(locale: string): Promise<ActionResult> {
  if (!isLocale(locale)) return { ok: false, error: "common.error" };
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateProfile(input: {
  full_name: string;
}): Promise<ActionResult> {
  const parsed = makeProfileSchema().safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation.nameMin" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", user.id);
  if (error) return { ok: false, error: "common.error" };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateAvatar(avatarUrl: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth.invalidCredentials" };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);
  if (error) return { ok: false, error: "common.error" };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePassword(input: {
  password: string;
  confirm: string;
}): Promise<ActionResult> {
  if (input.password.length < 8 || input.password !== input.confirm) {
    return { ok: false, error: "validation.passwordMismatch" };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error) return { ok: false, error: "common.error" };
  return { ok: true };
}
