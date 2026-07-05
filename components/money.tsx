"use client";

import { cn } from "@/lib/utils";
import { useMoney } from "@/components/money-context";
import type { CurrencyCode, TransactionType } from "@/types/database";

/**
 * The app's signature "ledger numeral": every monetary figure renders
 * through this component — tabular mono, converted to the user's
 * display currency, tinted by flow direction when asked to.
 */
export function Money({
  amount,
  currency,
  flow,
  signed = false,
  compact = false,
  className,
}: {
  amount: number;
  currency: CurrencyCode;
  /** Tint + sign by direction: income green, expense rose. */
  flow?: TransactionType;
  signed?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const { fmt } = useMoney();
  const value = flow === "expense" && signed ? -amount : amount;
  const text = fmt(Math.abs(value), currency, { compact });
  const prefix = signed ? (flow === "expense" ? "−" : "+") : "";

  return (
    <span
      dir="ltr"
      className={cn(
        "ledger-num whitespace-nowrap",
        flow === "income" && "text-income",
        flow === "expense" && "text-expense",
        className
      )}
    >
      {prefix}
      {text}
    </span>
  );
}
