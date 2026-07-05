"use client";

import { createContext, useContext, useMemo } from "react";
import { useLocale } from "next-intl";
import {
  convert,
  displayMoney,
  formatMoney,
  DEFAULT_RATES,
  type RateMap,
} from "@/lib/currency";
import type { CurrencyCode, Locale } from "@/types/database";

interface MoneyContextValue {
  /** The user's preferred display currency. */
  display: CurrencyCode;
  rates: RateMap;
  /** Convert + format any stored amount into the display currency. */
  fmt: (
    amount: number,
    from: CurrencyCode,
    options?: { signDisplay?: "auto" | "always" | "never"; compact?: boolean }
  ) => string;
  /** Format an amount already in the display currency. */
  fmtDisplay: (
    amount: number,
    options?: { signDisplay?: "auto" | "always" | "never"; compact?: boolean }
  ) => string;
  /** Convert a stored amount into display-currency units (number). */
  toDisplay: (amount: number, from: CurrencyCode) => number;
}

const MoneyContext = createContext<MoneyContextValue | null>(null);

export function MoneyProvider({
  display,
  rates,
  children,
}: {
  display: CurrencyCode;
  rates?: RateMap;
  children: React.ReactNode;
}) {
  const locale = useLocale() as Locale;
  const value = useMemo<MoneyContextValue>(() => {
    const r = rates ?? DEFAULT_RATES;
    return {
      display,
      rates: r,
      fmt: (amount, from, options) =>
        displayMoney(amount, from, display, r, locale, options),
      fmtDisplay: (amount, options) =>
        formatMoney(amount, display, locale, options),
      toDisplay: (amount, from) => convert(amount, from, display, r),
    };
  }, [display, rates, locale]);

  return <MoneyContext.Provider value={value}>{children}</MoneyContext.Provider>;
}

export function useMoney(): MoneyContextValue {
  const ctx = useContext(MoneyContext);
  if (!ctx) throw new Error("useMoney must be used inside <MoneyProvider>");
  return ctx;
}
