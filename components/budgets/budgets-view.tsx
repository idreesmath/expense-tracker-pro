"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, Plus, Target, Trash2, TriangleAlert } from "lucide-react";
import { createBudget, deleteBudget, updateBudget } from "@/actions/budgets";
import { makeBudgetSchema, type BudgetInput } from "@/lib/validations";
import { useAppData } from "@/components/app-context";
import { useMoney } from "@/components/money-context";
import { bagTotal, type MoneyBag } from "@/lib/aggregate";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Budget } from "@/types/database";

export function BudgetsView({
  budgets,
  spend,
}: {
  budgets: Budget[];
  spend: Record<string, MoneyBag>;
}) {
  const t = useTranslations();
  const router = useRouter();
  const { toDisplay, fmtDisplay } = useMoney();
  const { categories } = useAppData();
  const [editing, setEditing] = useState<Budget | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Budget | null>(null);
  const [pending, startTransition] = useTransition();

  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  const onDelete = () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    startTransition(async () => {
      const result = await deleteBudget(target.id);
      if (result.ok) toast.success(t("common.deleted"));
      else toast.error(t(result.error));
      setConfirmDelete(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus aria-hidden /> {t("budgets.addBudget")}
        </Button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState icon={Target} title={t("budgets.empty")} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {budgets.map((budget) => {
            const category = budget.category_id
              ? categoriesById.get(budget.category_id)
              : undefined;
            const spent = bagTotal(spend[budget.id] ?? { USD: 0, PKR: 0 }, toDisplay);
            const limit = toDisplay(Number(budget.amount), budget.currency);
            const pct = limit > 0 ? (spent / limit) * 100 : 0;
            const over = pct >= 100;
            const near = !over && pct >= budget.alert_threshold;

            return (
              <Card key={budget.id} className="group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{budget.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline">
                          {t(
                            budget.period === "monthly"
                              ? "budgets.monthly"
                              : "budgets.yearly"
                          )}
                        </Badge>
                        <Badge variant="secondary">
                          {category
                            ? category.is_default
                              ? t(`defaultCategories.${category.name}`)
                              : category.name
                            : t("budgets.allCategories")}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${budget.name} — ${t("common.edit")}`}
                        onClick={() => setEditing(budget)}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${budget.name} — ${t("common.delete")}`}
                        onClick={() => setConfirmDelete(budget)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  </div>

                  <p className="ledger-num mt-4 text-2xl font-medium" dir="ltr">
                    {fmtDisplay(spent)}
                    <span className="text-sm text-muted-foreground">
                      {" "}
                      / {fmtDisplay(limit)}
                    </span>
                  </p>

                  <Progress
                    value={Math.min(100, pct)}
                    aria-label={budget.name}
                    className={cn(
                      "mt-3",
                      over && "[&>[data-slot=progress-indicator]]:bg-destructive",
                      near && "[&>[data-slot=progress-indicator]]:bg-warning"
                    )}
                  />
                  <p
                    className={cn(
                      "mt-2 flex items-center gap-1.5 text-xs",
                      over
                        ? "font-medium text-destructive"
                        : near
                          ? "font-medium text-warning"
                          : "text-muted-foreground"
                    )}
                  >
                    {(over || near) && (
                      <TriangleAlert className="size-3.5" aria-hidden />
                    )}
                    {over
                      ? t("budgets.exceeded", { amount: fmtDisplay(spent - limit) })
                      : near
                        ? t("budgets.nearLimit", { percent: Math.round(pct) })
                        : t("budgets.healthy", { percent: Math.round(pct) })}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {(creating || editing) && (
        <BudgetDialog
          budget={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <AlertDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open: boolean) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("budgets.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("budgets.deleteBody", { name: confirmDelete?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BudgetDialog({
  budget,
  onClose,
}: {
  budget?: Budget;
  onClose: () => void;
}) {
  const t = useTranslations();
  const tv = useTranslations("validation");
  const router = useRouter();
  const { categories, settings } = useAppData();

  const schema = useMemo(() => makeBudgetSchema((k) => tv(k)), [tv]);
  const form = useForm<BudgetInput>({
    resolver: zodResolver(schema),
    defaultValues: budget
      ? {
          name: budget.name,
          category_id: budget.category_id,
          period: budget.period,
          amount: Number(budget.amount),
          currency: budget.currency,
          alert_threshold: budget.alert_threshold,
        }
      : {
          name: "",
          category_id: null,
          period: "monthly",
          amount: undefined,
          currency: settings.currency,
          alert_threshold: 80,
        },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = budget
      ? await updateBudget(budget.id, values)
      : await createBudget(values);
    if (!result.ok) {
      toast.error(t(result.error));
      return;
    }
    toast.success(budget ? t("common.updated") : t("common.added"));
    onClose();
    router.refresh();
  });

  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {budget ? t("budgets.editBudget") : t("budgets.addBudget")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("budgets.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("budgets.period")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">
                          {t("budgets.monthly")}
                        </SelectItem>
                        <SelectItem value="yearly">
                          {t("budgets.yearly")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.category")}</FormLabel>
                    <Select
                      value={field.value ?? "all"}
                      onValueChange={(v: string) => field.onChange(v === "all" ? null : v)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">
                          {t("budgets.allCategories")}
                        </SelectItem>
                        {categories
                          .filter((c) => c.kind !== "income")
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.is_default
                                ? t(`defaultCategories.${c.name}`)
                                : c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-3">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        className="ledger-num"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.currency")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="ledger-num w-24">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">$ USD</SelectItem>
                        <SelectItem value="PKR">₨ PKR</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alert_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("budgets.alertThreshold")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          className="ledger-num w-24 pe-6"
                          {...field}
                          value={field.value ?? ""}
                        />
                        <span className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          %
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
