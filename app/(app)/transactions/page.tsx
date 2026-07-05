import { getTranslations } from "next-intl/server";
import { parseLedgerFilters } from "@/lib/ledger-query";
import { fetchLedger } from "@/lib/ledger-server";
import { PageHeader } from "@/components/page-header";
import { LedgerTable } from "@/components/ledger/ledger-table";

export const metadata = { title: "Transactions" };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("transactions");
  const filters = parseLedgerFilters(await searchParams);
  const { rows, total } = await fetchLedger(filters);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <LedgerTable rows={rows} total={total} filters={filters} />
    </div>
  );
}
