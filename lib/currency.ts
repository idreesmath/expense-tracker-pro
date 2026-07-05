import type { CurrencyCode, Locale } from "@/types/database";

/**
 * Currency math for the two supported currencies.
 *
 * Rates are anchored to USD (`rate_to_usd`: 1 unit of the currency in USD)
 * and come from the `currencies` table, so re-rating the app is a single
 * row update. Live FX feeds are explicitly out of scope.
 */

export type RateMap = Record<CurrencyCode, number>;

export const DEFAULT_RATES: RateMap = {
  USD: 1,
  PKR: 0.00359712, // 1 USD ≈ 278 PKR
};

export const CURRENCY_META: Record<
  CurrencyCode,
  { symbol: string; intlLocale: Record<Locale, string> }
> = {
  USD: { symbol: "$", intlLocale: { en: "en-US", ur: "ur-PK" } },
  PKR: { symbol: "₨", intlLocale: { en: "en-PK", ur: "ur-PK" } },
};

/** Convert between currencies via the USD anchor. Round to cents at the end. */
export function convert(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: RateMap = DEFAULT_RATES
): number {
  if (from === to) return amount;
  const usd = amount * rates[from];
  return roundMoney(usd / rates[to]);
}

/** Bankers-free half-up rounding to 2 decimals, safe for display totals. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Sum mixed-currency line items into a single display currency. */
export function sumInCurrency(
  items: ReadonlyArray<{ amount: number; currency: CurrencyCode }>,
  display: CurrencyCode,
  rates: RateMap = DEFAULT_RATES
): number {
  const total = items.reduce(
    (acc, item) => acc + convert(item.amount, item.currency, display, rates),
    0
  );
  return roundMoney(total);
}

/**
 * Format an amount in the display currency for the active locale.
 * Urdu uses ur-PK digit grouping; the ₨ sign is normalized so PKR
 * renders consistently across engines.
 */
export function formatMoney(
  amount: number,
  currency: CurrencyCode,
  locale: Locale = "en",
  options?: { signDisplay?: "auto" | "always" | "never"; compact?: boolean }
): string {
  const formatter = new Intl.NumberFormat(
    CURRENCY_META[currency].intlLocale[locale],
    {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      signDisplay: options?.signDisplay ?? "auto",
      notation: options?.compact ? "compact" : "standard",
      maximumFractionDigits: options?.compact ? 1 : 2,
      minimumFractionDigits: options?.compact ? 0 : 2,
    }
  );
  // Some ICU builds emit "Rs" for PKR; the app standardizes on ₨.
  return formatter.format(amount).replace(/Rs\.?\s?/, "₨");
}

/** Convert then format in one step — the common display path. */
export function displayMoney(
  amount: number,
  from: CurrencyCode,
  display: CurrencyCode,
  rates: RateMap = DEFAULT_RATES,
  locale: Locale = "en",
  options?: { signDisplay?: "auto" | "always" | "never"; compact?: boolean }
): string {
  return formatMoney(convert(amount, from, display, rates), display, locale, options);
}
