import { getTranslations } from "next-intl/server";
import { parseLedgerFilters } from "@/lib/ledger-query";
import { fetchLedger } from "@/lib/ledger-server";
import { PageHeader } from "@/components/page-header";
import { LedgerTable } from "@/components/ledger/ledger-table";
import { AddEntryButton } from "@/components/ledger/add-entry-button";

export const metadata = { title: "Expenses" };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("expenses");
  const filters = parseLedgerFilters(await searchParams);
  const { rows, total } = await fetchLedger(filters, "expense");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={<AddEntryButton kind="expense" label={t("addExpense")} />}
      />
      <LedgerTable rows={rows} total={total} filters={filters} kind="expense" />
    </div>
  );
}
