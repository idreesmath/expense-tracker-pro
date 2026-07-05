"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  CalendarClock,
  Flag,
  HandCoins,
  Plus,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { useAppData } from "@/components/app-context";
import { useMoney } from "@/components/money-context";
import { Money } from "@/components/money";
import { bagTotal, type MoneyBag } from "@/lib/aggregate";
import { formatDate } from "@/lib/format";
import { categoryIcon } from "@/lib/category-icons";
import { createGoal, createRecurring, deleteGoal, deleteRecurring, updateGoalSaved } from "@/actions/misc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  Budget,
  CurrencyCode,
  Goal,
  RecurringRule,
  Transaction,
} from "@/types/database";

type CategoryLite = {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
};

function useCategoryName() {
  const tdc = useTranslations("defaultCategories");
  return (category: CategoryLite | undefined) =>
    category ? (category.is_default ? tdc(category.name) : category.name) : tdc("Other");
}

// ---------------------------------------------------------------- recent

export function RecentTransactionsCard({
  recent,
  categories,
  className,
}: {
  recent: Transaction[];
  categories: CategoryLite[];
  className?: string;
}) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale() as "en" | "ur";
  const byId = new Map(categories.map((c) => [c.id, c]));
  const categoryName = useCategoryName();

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{t("recentTransactions")}</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/transactions">{tc("viewAll")}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("noTransactions")}
          </p>
        ) : (
          <ul>
            {recent.map((tx) => {
              const category = tx.category_id ? byId.get(tx.category_id) : undefined;
              const Icon = categoryIcon(category?.icon);
              return (
                <li
                  key={`${tx.type}-${tx.id}`}
                  className="ledger-rule flex items-center gap-3 py-2.5 last:border-b-0"
                >
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-md"
                    style={{ background: `${category?.color ?? "#8a938e"}1a` }}
                  >
                    <Icon
                      className="size-4"
                      style={{ color: category?.color ?? "var(--muted-foreground)" }}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {tx.description}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {categoryName(category)} · {formatDate(tx.occurred_on, locale)}
                    </span>
                  </span>
                  <Money
                    amount={Number(tx.amount)}
                    currency={tx.currency}
                    flow={tx.type}
                    signed
                    className="text-sm font-medium"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- quick add

export function QuickAddCard({ className }: { className?: string }) {
  const t = useTranslations("dashboard");
  const { openEntry } = useAppData();

  return (
    <Card className={className}>
      <CardContent className="grid grid-cols-2 gap-3 p-4">
        <Button
          variant="outline"
          className="h-auto flex-col gap-2 py-4"
          onClick={() => openEntry("expense")}
        >
          <ReceiptText className="size-5 text-expense" aria-hidden />
          <span className="text-xs">{t("quickAddExpense")}</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto flex-col gap-2 py-4"
          onClick={() => openEntry("income")}
        >
          <HandCoins className="size-5 text-income" aria-hidden />
          <span className="text-xs">{t("quickAddIncome")}</span>
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- budgets

export function BudgetProgressCard({
  budgets,
  spend,
  className,
}: {
  budgets: Budget[];
  spend: Record<string, MoneyBag>;
  className?: string;
}) {
  const t = useTranslations("dashboard");
  const tb = useTranslations("budgets");
  const tc = useTranslations("common");
  const { toDisplay, fmtDisplay } = useMoney();

  const shown = budgets.slice(0, 4);

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{t("budgetProgress")}</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/budgets">{tc("viewAll")}</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {shown.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t("noBudgets")}
          </p>
        ) : (
          shown.map((budget) => {
            const spentDisplay = bagTotal(
              spend[budget.id] ?? { USD: 0, PKR: 0 },
              toDisplay
            );
            const limitDisplay = toDisplay(Number(budget.amount), budget.currency);
            const pct = limitDisplay > 0 ? (spentDisplay / limitDisplay) * 100 : 0;
            const over = pct >= 100;
            const near = !over && pct >= budget.alert_threshold;
            return (
              <div key={budget.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{budget.name}</span>
                  <span className="ledger-num shrink-0 text-xs text-muted-foreground" dir="ltr">
                    {tb("spentOf", {
                      spent: fmtDisplay(spentDisplay, { compact: true }),
                      total: fmtDisplay(limitDisplay, { compact: true }),
                    })}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, pct)}
                  aria-label={budget.name}
                  className={cn(
                    over && "[&>[data-slot=progress-indicator]]:bg-destructive",
                    near && "[&>[data-slot=progress-indicator]]:bg-warning"
                  )}
                />
                <p
                  className={cn(
                    "mt-1 text-xs",
                    over
                      ? "font-medium text-destructive"
                      : near
                        ? "font-medium text-warning"
                        : "text-muted-foreground"
                  )}
                >
                  {over
                    ? tb("exceeded", {
                        amount: fmtDisplay(spentDisplay - limitDisplay),
                      })
                    : near
                      ? tb("nearLimit", { percent: Math.round(pct) })
                      : tb("healthy", { percent: Math.round(pct) })}
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- bills

export function UpcomingBillsCard({
  bills,
  className,
}: {
  bills: RecurringRule[];
  className?: string;
}) {
  const t = useTranslations("dashboard");
  const tf = useTranslations("frequencies");
  const locale = useLocale() as "en" | "ur";
  const [pending, startTransition] = useTransition();

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{t("upcomingBills")}</CardTitle>
        <AddRecurringDialog />
      </CardHeader>
      <CardContent>
        {bills.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t("noBills")}
          </p>
        ) : (
          <ul className="space-y-2.5">
            {bills.map((bill) => (
              <li key={bill.id} className="group flex items-center gap-2.5">
                <CalendarClock
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{bill.description}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t("dueOn", { date: formatDate(bill.next_run_on, locale) })} ·{" "}
                    {tf(bill.frequency)}
                  </span>
                </span>
                <Money
                  amount={Number(bill.amount)}
                  currency={bill.currency}
                  flow={bill.kind}
                  className="text-xs font-medium"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${bill.description} — delete`}
                  disabled={pending}
                  className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteRecurring(bill.id);
                    })
                  }
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AddRecurringDialog() {
  const t = useTranslations();
  const { categories, settings } = useAppData();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    kind: "expense" as "expense" | "income",
    description: "",
    amount: "",
    currency: settings.currency as CurrencyCode,
    category_id: "",
    payment_method_id: "",
    frequency: "monthly" as const,
    next_run_on: new Date().toISOString().slice(0, 10),
  });

  const submit = () =>
    startTransition(async () => {
      const result = await createRecurring({
        ...form,
        amount: Number(form.amount),
        category_id: form.category_id || null,
        payment_method_id: form.payment_method_id || null,
        end_on: null,
      });
      if (result.ok) {
        toast.success(t("common.added"));
        setOpen(false);
      } else {
        toast.error(t(result.error));
      }
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("common.add")}>
          <Plus className="size-4" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {t("dashboard.upcomingBills")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>{t("common.type")}</Label>
              <Select
                value={form.kind}
                onValueChange={(v: string) =>
                  setForm((f) => ({ ...f, kind: v as "expense" | "income" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">{t("common.expense")}</SelectItem>
                  <SelectItem value="income">{t("common.income")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("budgets.period")}</Label>
              <Select
                value={form.frequency}
                onValueChange={(v: string) =>
                  setForm((f) => ({ ...f, frequency: v as typeof f.frequency }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["daily", "weekly", "monthly", "yearly"] as const).map((fr) => (
                    <SelectItem key={fr} value={fr}>
                      {t(`frequencies.${fr}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rec-desc">{t("common.description")}</Label>
            <Input
              id="rec-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="rec-amount">{t("common.amount")}</Label>
              <Input
                id="rec-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                className="ledger-num"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("common.currency")}</Label>
              <Select
                value={form.currency}
                onValueChange={(v: string) =>
                  setForm((f) => ({ ...f, currency: v as CurrencyCode }))
                }
              >
                <SelectTrigger className="ledger-num w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">$ USD</SelectItem>
                  <SelectItem value="PKR">₨ PKR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>{t("common.category")}</Label>
              <Select
                value={form.category_id}
                onValueChange={(v: string) => setForm((f) => ({ ...f, category_id: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c.kind === form.kind || c.kind === "both")
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.is_default ? t(`defaultCategories.${c.name}`) : c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rec-date">{t("common.date")}</Label>
              <Input
                id="rec-date"
                type="date"
                value={form.next_run_on}
                onChange={(e) =>
                  setForm((f) => ({ ...f, next_run_on: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={submit}
            disabled={pending || !form.description || !form.amount}
          >
            {t("common.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------- top categories

export function TopCategoriesCard({
  categorySpend,
  categories,
  className,
}: {
  categorySpend: Array<{ categoryId: string; bag: MoneyBag }>;
  categories: CategoryLite[];
  className?: string;
}) {
  const t = useTranslations("dashboard");
  const { toDisplay, fmtDisplay } = useMoney();
  const categoryName = useCategoryName();
  const byId = new Map(categories.map((c) => [c.id, c]));

  const top = useMemo(
    () =>
      categorySpend
        .map((entry) => ({
          category: byId.get(entry.categoryId),
          value: bagTotal(entry.bag, toDisplay),
        }))
        .filter((r) => r.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categorySpend, categories, toDisplay]
  );
  const max = top[0]?.value ?? 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{t("topCategories")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {top.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t("noTransactions")}
          </p>
        ) : (
          top.map((row, index) => {
            const Icon = categoryIcon(row.category?.icon);
            return (
              <div key={row.category?.id ?? index} className="flex items-center gap-2.5">
                <Icon
                  className="size-4 shrink-0"
                  style={{ color: row.category?.color ?? "var(--muted-foreground)" }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm">{categoryName(row.category)}</span>
                    <span className="ledger-num text-xs text-muted-foreground" dir="ltr">
                      {fmtDisplay(row.value, { compact: true })}
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${max > 0 ? (row.value / max) * 100 : 0}%`,
                        background: row.category?.color ?? "var(--chart-other)",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- calendar

export function MiniCalendarCard({
  calendar,
  className,
}: {
  calendar: Record<string, MoneyBag>;
  className?: string;
}) {
  const t = useTranslations("dashboard");
  const { toDisplay, fmtDisplay } = useMoney();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const totals = useMemo(() => {
    const map: Record<number, number> = {};
    let max = 0;
    for (const [day, bag] of Object.entries(calendar)) {
      const dayNum = Number(day.slice(8, 10));
      const value = bagTotal(bag, toDisplay);
      map[dayNum] = value;
      max = Math.max(max, value);
    }
    return { map, max };
  }, [calendar, toDisplay]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{t("calendar")}</CardTitle>
      </CardHeader>
      <CardContent dir="ltr">
        <div className="grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const value = totals.map[day] ?? 0;
            const intensity = totals.max > 0 ? value / totals.max : 0;
            const isToday = day === today.getDate();
            return (
              <span
                key={day}
                title={value > 0 ? fmtDisplay(value) : undefined}
                className={cn(
                  "ledger-num flex aspect-square items-center justify-center rounded text-[10px]",
                  isToday && "ring-1 ring-primary"
                )}
                style={{
                  background:
                    intensity > 0
                      ? `color-mix(in oklch, var(--expense) ${Math.max(12, intensity * 85)}%, transparent)`
                      : undefined,
                  color: intensity > 0.55 ? "var(--destructive-foreground)" : undefined,
                }}
              >
                {day}
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- goals

export function GoalsCard({ goals, className }: { goals: Goal[]; className?: string }) {
  const t = useTranslations("dashboard");
  const { fmt } = useMoney();
  const [pending, startTransition] = useTransition();

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{t("goals")}</CardTitle>
        <AddGoalDialog />
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t("noGoals")}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => {
              const pct = Math.min(
                100,
                (Number(goal.saved_amount) / Number(goal.target_amount)) * 100
              );
              return (
                <div key={goal.id} className="group rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Flag
                        className="size-4 shrink-0"
                        style={{ color: goal.color }}
                        aria-hidden
                      />
                      <span className="truncate text-sm font-medium">{goal.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${goal.name} — delete`}
                      disabled={pending}
                      className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={() =>
                        startTransition(async () => {
                          await deleteGoal(goal.id);
                        })
                      }
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                  <Progress value={pct} className="mt-3" aria-label={goal.name} />
                  <p className="ledger-num mt-2 text-xs text-muted-foreground" dir="ltr">
                    {t("goalSaved", {
                      saved: fmt(Number(goal.saved_amount), goal.currency),
                      target: fmt(Number(goal.target_amount), goal.currency),
                    })}
                  </p>
                  <UpdateSavedInline goal={goal} />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UpdateSavedInline({ goal }: { goal: Goal }) {
  const tc = useTranslations("common");
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const amount = Number(value);
        if (!Number.isFinite(amount) || amount < 0) return;
        startTransition(async () => {
          const result = await updateGoalSaved(goal.id, amount);
          if (result.ok) {
            toast.success(tc("updated"));
            setValue("");
          }
        });
      }}
    >
      <Input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        placeholder={String(goal.saved_amount)}
        aria-label={`${goal.name} — ${tc("amount")}`}
        className="ledger-num h-8 text-xs"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending || !value}>
        {tc("save")}
      </Button>
    </form>
  );
}

function AddGoalDialog() {
  const t = useTranslations();
  const { settings } = useAppData();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    target_amount: "",
    currency: settings.currency as CurrencyCode,
    due_on: "",
  });

  const submit = () =>
    startTransition(async () => {
      const result = await createGoal({
        name: form.name,
        target_amount: Number(form.target_amount),
        saved_amount: 0,
        currency: form.currency,
        due_on: form.due_on || null,
        color: "#177154",
      });
      if (result.ok) {
        toast.success(t("common.added"));
        setOpen(false);
        setForm((f) => ({ ...f, name: "", target_amount: "", due_on: "" }));
      } else {
        toast.error(t(result.error));
      }
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Plus className="size-4" aria-hidden /> {t("dashboard.addGoal")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">{t("dashboard.addGoal")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="goal-name">{t("categories.name")}</Label>
            <Input
              id="goal-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="goal-target">{t("common.amount")}</Label>
              <Input
                id="goal-target"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                className="ledger-num"
                value={form.target_amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, target_amount: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("common.currency")}</Label>
              <Select
                value={form.currency}
                onValueChange={(v: string) =>
                  setForm((f) => ({ ...f, currency: v as CurrencyCode }))
                }
              >
                <SelectTrigger className="ledger-num w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">$ USD</SelectItem>
                  <SelectItem value="PKR">₨ PKR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="goal-due">{t("common.date")}</Label>
            <Input
              id="goal-due"
              type="date"
              value={form.due_on}
              onChange={(e) => setForm((f) => ({ ...f, due_on: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={submit}
            disabled={pending || !form.name || !form.target_amount}
          >
            {t("common.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
