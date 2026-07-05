"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileSpreadsheet, FileText, Printer, Table2 } from "lucide-react";
import { useMoney } from "@/components/money-context";
import { useAppData } from "@/components/app-context";
import { Money } from "@/components/money";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/currency";
import {
  exportCsv,
  exportExcel,
  exportPdf,
  type ReportMeta,
  type ReportRow,
} from "@/lib/exporters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Locale, Transaction } from "@/types/database";

export function ReportsView({
  rows,
  from,
  to,
}: {
  rows: Transaction[];
  from: string;
  to: string;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { display, toDisplay, fmtDisplay } = useMoney();
  const { categories, paymentMethods } = useAppData();

  const setRange = (key: "from" | "to", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const { reportRows, totals } = useMemo(() => {
    const categoriesById = new Map(categories.map((c) => [c.id, c]));
    const paymentsById = new Map(paymentMethods.map((m) => [m.id, m]));

    const income = rows
      .filter((tx) => tx.type === "income")
      .reduce((acc, tx) => acc + toDisplay(Number(tx.amount), tx.currency), 0);
    const expense = rows
      .filter((tx) => tx.type === "expense")
      .reduce((acc, tx) => acc + toDisplay(Number(tx.amount), tx.currency), 0);

    const reportRows: ReportRow[] = rows.map((tx) => {
      const value = toDisplay(Number(tx.amount), tx.currency);
      const category = tx.category_id
        ? categoriesById.get(tx.category_id)
        : undefined;
      return {
        date: tx.occurred_on,
        type: t(tx.type === "income" ? "common.income" : "common.expense"),
        description: tx.description,
        category: category
          ? category.is_default
            ? t(`defaultCategories.${category.name}`)
            : category.name
          : "—",
        paymentMethod: tx.payment_method_id
          ? (paymentsById.get(tx.payment_method_id)?.name ?? "—")
          : "—",
        status: t(`statuses.${tx.status}`),
        originalAmount: formatMoney(Number(tx.amount), tx.currency, "en"),
        amountInDisplay: Math.round(value * 100) / 100,
      };
    });

    return {
      reportRows,
      totals: {
        income: Math.round(income * 100) / 100,
        expense: Math.round(expense * 100) / 100,
        net: Math.round((income - expense) * 100) / 100,
      },
    };
  }, [rows, categories, paymentMethods, toDisplay, t]);

  const meta: ReportMeta = {
    title: `${t("common.appName")} — ${t("reports.statement")}`,
    period: `${from} → ${to}`,
    currency: display,
    generated: t("reports.generatedOn", { date: formatDate(new Date(), locale) }),
    columns: {
      date: t("common.date"),
      type: t("common.type"),
      description: t("common.description"),
      category: t("common.category"),
      paymentMethod: t("common.paymentMethod"),
      status: t("common.status"),
      originalAmount: t("common.amount"),
      amount: t("common.total"),
    },
    summary: {
      income: t("reports.incomeTotal"),
      expense: t("reports.expenseTotal"),
      net: t("reports.netTotal"),
    },
    totals,
  };

  const guard = (fn: () => void | Promise<void>) => async () => {
    try {
      await fn();
    } catch {
      toast.error(t("common.error"));
    }
  };

  return (
    <div className="space-y-4">
      {/* controls */}
      <div className="no-print flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="report-from">{t("transactions.filterFrom")}</Label>
          <Input
            id="report-from"
            type="date"
            value={from}
            onChange={(e) => setRange("from", e.target.value)}
            className="w-40"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="report-to">{t("transactions.filterTo")}</Label>
          <Input
            id="report-to"
            type="date"
            value={to}
            onChange={(e) => setRange("to", e.target.value)}
            className="w-40"
          />
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          <Button variant="outline" onClick={guard(() => exportCsv(reportRows, meta))}>
            <Table2 aria-hidden /> {t("reports.exportCsv")}
          </Button>
          <Button variant="outline" onClick={guard(() => exportExcel(reportRows, meta))}>
            <FileSpreadsheet aria-hidden /> {t("reports.exportExcel")}
          </Button>
          <Button variant="outline" onClick={guard(() => exportPdf(reportRows, meta))}>
            <FileText aria-hidden /> {t("reports.exportPdf")}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer aria-hidden /> {t("reports.printView")}
          </Button>
        </div>
      </div>

      {/* print header */}
      <div className="print-only">
        <h2 className="text-xl font-semibold">{meta.title}</h2>
        <p className="text-sm">{meta.period} · {meta.generated}</p>
      </div>

      {/* summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            [t("reports.incomeTotal"), totals.income, "text-income"],
            [t("reports.expenseTotal"), totals.expense, "text-expense"],
            [t("reports.netTotal"), totals.net, totals.net >= 0 ? "text-income" : "text-expense"],
          ] as const
        ).map(([label, value, tone]) => (
          <Card key={label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`ledger-num text-2xl font-medium ${tone}`} dir="ltr">
                {fmtDisplay(value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {t("reports.openingNote", { currency: display })} ·{" "}
        {t("reports.entryCount", { count: rows.length })}
      </p>

      {/* statement table */}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            {t("reports.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.date")}</TableHead>
                <TableHead>{t("common.type")}</TableHead>
                <TableHead>{t("common.description")}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {t("common.category")}
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  {t("common.paymentMethod")}
                </TableHead>
                <TableHead className="text-end">{t("common.amount")}</TableHead>
                <TableHead className="text-end">
                  {t("common.total")} ({display})
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((tx, index) => (
                <TableRow key={`${tx.type}-${tx.id}`}>
                  <TableCell className="ledger-num whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(tx.occurred_on, locale)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {t(tx.type === "income" ? "common.income" : "common.expense")}
                  </TableCell>
                  <TableCell className="max-w-56 truncate font-medium">
                    {tx.description}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {reportRows[index]?.category}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {reportRows[index]?.paymentMethod}
                  </TableCell>
                  <TableCell className="ledger-num text-end text-xs text-muted-foreground">
                    <span dir="ltr">{reportRows[index]?.originalAmount}</span>
                  </TableCell>
                  <TableCell className="text-end">
                    <Money
                      amount={Number(tx.amount)}
                      currency={tx.currency}
                      flow={tx.type}
                      signed
                      className="text-sm"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
