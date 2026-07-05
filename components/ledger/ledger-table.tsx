"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowDownUp,
  FilterX,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { deleteEntry } from "@/actions/ledger";
import { useAppData } from "@/components/app-context";
import { Money } from "@/components/money";
import { formatDate } from "@/lib/format";
import { categoryIcon } from "@/lib/category-icons";
import { LEDGER_PAGE_SIZE, type LedgerFilters } from "@/lib/ledger-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import type {
  LedgerEntry,
  Transaction,
  TransactionType,
} from "@/types/database";

const STATUS_VARIANT = {
  cleared: "secondary",
  pending: "outline",
  scheduled: "outline",
} as const;

/**
 * The unified ledger list: URL-driven search/filter/sort/pagination,
 * used by Expenses, Income and the combined Transactions history.
 */
export function LedgerTable({
  rows,
  total,
  filters,
  kind,
}: {
  rows: Transaction[];
  total: number;
  filters: LedgerFilters;
  /** Fixed ledger for expenses/income pages; undefined = mixed view. */
  kind?: TransactionType;
}) {
  const t = useTranslations();
  const locale = useLocale() as "en" | "ur";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { categories, paymentMethods, openEntry } = useAppData();
  const [confirmDelete, setConfirmDelete] = useState<Transaction | null>(null);
  const [pending, startTransition] = useTransition();

  const categoriesById = new Map(categories.map((c) => [c.id, c]));
  const paymentsById = new Map(paymentMethods.map((m) => [m.id, m]));
  const pages = Math.max(1, Math.ceil(total / LEDGER_PAGE_SIZE));

  const setParam = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      if (!("page" in patch)) params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const toggleSort = (column: "occurred_on" | "amount") => {
    const dir =
      filters.sort === column && filters.dir === "desc" ? "asc" : "desc";
    setParam({ sort: column, dir });
  };

  const hasFilters = Boolean(
    filters.q ||
      filters.category ||
      filters.status ||
      filters.currency ||
      filters.payment ||
      filters.from ||
      filters.to ||
      filters.type
  );

  const onDelete = () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    startTransition(async () => {
      const result = await deleteEntry(target.type, target.id);
      if (result.ok) toast.success(t("common.deleted"));
      else toast.error(t(result.error));
      setConfirmDelete(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* ---- filter row ---- */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            defaultValue={filters.q}
            placeholder={t("transactions.searchPlaceholder")}
            aria-label={t("common.search")}
            className="ps-8"
            onKeyDown={(e) => {
              if (e.key === "Enter")
                setParam({ q: (e.target as HTMLInputElement).value });
            }}
            onBlur={(e) => {
              if (e.target.value !== filters.q) setParam({ q: e.target.value });
            }}
          />
        </div>

        {!kind && (
          <Select
            value={filters.type || "all"}
            onValueChange={(v) => setParam({ type: v === "all" ? "" : v })}
          >
            <SelectTrigger size="sm" aria-label={t("transactions.filterType")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="expense">{t("common.expense")}</SelectItem>
              <SelectItem value="income">{t("common.income")}</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select
          value={filters.category || "all"}
          onValueChange={(v) => setParam({ category: v === "all" ? "" : v })}
        >
          <SelectTrigger size="sm" aria-label={t("transactions.filterCategory")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("common.all")} — {t("common.category")}
            </SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.is_default ? t(`defaultCategories.${c.name}`) : c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status || "all"}
          onValueChange={(v) => setParam({ status: v === "all" ? "" : v })}
        >
          <SelectTrigger size="sm" aria-label={t("transactions.filterStatus")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("common.all")} — {t("common.status")}
            </SelectItem>
            {(["cleared", "pending", "scheduled"] as const).map((s) => (
              <SelectItem key={s} value={s}>
                {t(`statuses.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.currency || "all"}
          onValueChange={(v) => setParam({ currency: v === "all" ? "" : v })}
        >
          <SelectTrigger size="sm" aria-label={t("transactions.filterCurrency")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("common.all")} — {t("common.currency")}
            </SelectItem>
            <SelectItem value="USD">$ USD</SelectItem>
            <SelectItem value="PKR">₨ PKR</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.payment || "all"}
          onValueChange={(v) => setParam({ payment: v === "all" ? "" : v })}
        >
          <SelectTrigger size="sm" aria-label={t("transactions.filterPayment")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("common.all")} — {t("common.paymentMethod")}
            </SelectItem>
            {paymentMethods.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={filters.from}
          aria-label={t("transactions.filterFrom")}
          className="h-8 w-36"
          onChange={(e) => setParam({ from: e.target.value })}
        />
        <Input
          type="date"
          value={filters.to}
          aria-label={t("transactions.filterTo")}
          className="h-8 w-36"
          onChange={(e) => setParam({ to: e.target.value })}
        />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(pathname)}
          >
            <FilterX aria-hidden /> {t("transactions.clearFilters")}
          </Button>
        )}
      </div>

      {/* ---- table ---- */}
      {rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title={hasFilters ? t("transactions.empty") : t("transactions.emptyLedger")}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort("occurred_on")}
                  >
                    {t("common.date")}
                    <ArrowDownUp className="size-3" aria-hidden />
                  </button>
                </TableHead>
                <TableHead>{t("common.description")}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {t("common.category")}
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  {t("common.paymentMethod")}
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  {t("common.status")}
                </TableHead>
                <TableHead className="text-end">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort("amount")}
                  >
                    {t("common.amount")}
                    <ArrowDownUp className="size-3" aria-hidden />
                  </button>
                </TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">{t("common.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((tx) => {
                const category = tx.category_id
                  ? categoriesById.get(tx.category_id)
                  : undefined;
                const Icon = categoryIcon(category?.icon);
                const payment = tx.payment_method_id
                  ? paymentsById.get(tx.payment_method_id)
                  : undefined;
                return (
                  <TableRow key={`${tx.type}-${tx.id}`}>
                    <TableCell className="ledger-num whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(tx.occurred_on, locale)}
                    </TableCell>
                    <TableCell className="max-w-56">
                      <span className="block truncate font-medium">
                        {tx.description}
                      </span>
                      {tx.sub_category && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {tx.sub_category}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="flex items-center gap-1.5 text-sm">
                        <Icon
                          className="size-3.5"
                          style={{ color: category?.color }}
                          aria-hidden
                        />
                        {category
                          ? category.is_default
                            ? t(`defaultCategories.${category.name}`)
                            : category.name
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {payment?.name ?? "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={STATUS_VARIANT[tx.status]}
                        className={cn(
                          tx.status === "pending" && "text-warning",
                          tx.status === "scheduled" && "text-muted-foreground"
                        )}
                      >
                        {t(`statuses.${tx.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <Money
                        amount={Number(tx.amount)}
                        currency={tx.currency}
                        flow={tx.type}
                        signed={!kind}
                        className="text-sm font-medium"
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("common.actions")}
                          >
                            <MoreHorizontal className="size-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              openEntry(tx.type, {
                                ...tx,
                                account_id: tx.account_id,
                              } as LedgerEntry)
                            }
                          >
                            <Pencil aria-hidden /> {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setConfirmDelete(tx)}
                          >
                            <Trash2 aria-hidden /> {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ---- pagination ---- */}
      {total > LEDGER_PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {t("common.showing", {
              from: (filters.page - 1) * LEDGER_PAGE_SIZE + 1,
              to: Math.min(filters.page * LEDGER_PAGE_SIZE, total),
              total,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => setParam({ page: String(filters.page - 1) })}
            >
              {t("common.previous")}
            </Button>
            <span className="ledger-num text-xs text-muted-foreground">
              {t("common.page", { page: filters.page, pages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page >= pages}
              onClick={() => setParam({ page: String(filters.page + 1) })}
            >
              {t("common.next")}
            </Button>
          </div>
        </div>
      )}

      {/* ---- delete confirmation ---- */}
      <AlertDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                confirmDelete?.type === "income"
                  ? "income.deleteTitle"
                  : "expenses.deleteTitle"
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                confirmDelete?.type === "income"
                  ? "income.deleteBody"
                  : "expenses.deleteBody",
                { name: confirmDelete?.description ?? "" }
              )}
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
