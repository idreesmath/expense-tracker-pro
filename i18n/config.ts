import type { Locale } from "@/types/database";

export const locales: Locale[] = ["en", "ur"];
export const defaultLocale: Locale = "en";

/** Cookie the active locale persists in (mirrored to settings for users). */
export const LOCALE_COOKIE = "ETP_LOCALE";

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "ur";
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return locale === "ur" ? "rtl" : "ltr";
}
