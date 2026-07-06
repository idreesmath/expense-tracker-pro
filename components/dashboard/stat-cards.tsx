"use client";

import { useTranslations } from "next-intl";
import { HandCoins, ReceiptText, Scale, Wallet } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useMoney } from "@/components/money-context";
import { AnimatedCounter } from "@/components/animated-counter";
import { bagTotal, type MoneyBag } from "@/lib/aggregate";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * The balance hero (guilloché, like the face of a note) plus three
 * ledger stat tiles. All figures animate and re-derive from the raw
 * per-currency bags, so a currency switch recalculates instantly.
 */
export function StatCards({
  totals,
}: {
  totals: {
    income: MoneyBag;
    expense: MoneyBag;
    monthIncome: MoneyBag;
    monthExpense: MoneyBag;
  };
}) {
  const t = useTranslations("dashboard");
  const { toDisplay, fmtDisplay } = useMoney();
  const reduced = useReducedMotion();

  const income = bagTotal(totals.income, toDisplay);
  const expense = bagTotal(totals.expense, toDisplay);
  const balance = income - expense;
  const monthIncome = bagTotal(totals.monthIncome, toDisplay);
  const monthExpense = bagTotal(totals.monthExpense, toDisplay);
  const savings = monthIncome - monthExpense;
  const savingsRate =
    monthIncome > 0 ? Math.round((savings / monthIncome) * 100) : 0;

  const tiles = [
    {
      icon: HandCoins,
      label: t("totalIncome"),
      value: income,
      accent: "text-income",
    },
    {
      icon: ReceiptText,
      label: t("totalExpenses"),
      value: expense,
      accent: "text-expense",
    },
    {
      icon: Wallet,
      label: t("totalSavings"),
      value: savings,
      accent: savings >= 0 ? "text-income" : "text-expense",
      sub: monthIncome > 0 ? `${savingsRate}% ${t("savingsRate")}` : undefined,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {/* Balance hero */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="guilloche h-full border-0 bg-sidebar text-sidebar-foreground">
          <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-sidebar-foreground/70">
                {t("totalBalance")}
              </p>
              <Scale className="size-4 text-sidebar-primary" aria-hidden />
            </div>
            <AnimatedCounter
              value={balance}
              format={(n) => fmtDisplay(n)}
              className="ledger-num block text-center text-xl font-medium tracking-tight text-sidebar-primary"
            />
          </CardContent>
        </Card>
      </motion.div>

      {tiles.map((tile, index) => (
        <motion.div
          key={tile.label}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 * (index + 1) }}
        >
          <Card className="h-full">
            <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{tile.label}</p>
                <tile.icon
                  className="size-4 text-muted-foreground/70"
                  aria-hidden
                />
              </div>
              <div className="text-center">
                <AnimatedCounter
                  value={tile.value}
                  format={(n) => fmtDisplay(n)}
                  className={cn(
                    "ledger-num block text-xl font-medium tracking-tight",
                    tile.accent
                  )}
                />
                {tile.sub && (
                  <p className="mt-1 text-xs text-muted-foreground">{tile.sub}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
