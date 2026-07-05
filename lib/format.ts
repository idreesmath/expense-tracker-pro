import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import type { Locale as AppLocale } from "@/types/database";

/** date-fns has no Urdu locale; dates stay in Latin digits with ur-PK order. */
export function formatDate(date: string | Date, locale: AppLocale = "en"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (locale === "ur") {
    return new Intl.DateTimeFormat("ur-PK", { dateStyle: "medium" }).format(d);
  }
  return format(d, "d MMM yyyy", { locale: enUS });
}

export function formatMonth(date: string | Date, locale: AppLocale = "en"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "ur" ? "ur-PK" : "en-US", {
    month: "short",
    year: "numeric",
  }).format(d);
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatNumber(value: number, locale: AppLocale = "en"): string {
  return new Intl.NumberFormat(locale === "ur" ? "ur-PK" : "en-US").format(value);
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.min(200, Math.round((part / whole) * 100));
}
