import type { CurrencyCode, TransactionStatus, TransactionType } from "@/types/database";

/** URL-driven filters shared by the expenses, income and transactions pages. */
export interface LedgerFilters {
  q: string;
  category: string;
  status: TransactionStatus | "";
  currency: CurrencyCode | "";
  payment: string;
  from: string;
  to: string;
  sort: "occurred_on" | "amount";
  dir: "asc" | "desc";
  page: number;
  type: TransactionType | "";
}

export const LEDGER_PAGE_SIZE = 15;

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

export function parseLedgerFilters(sp: SearchParams): LedgerFilters {
  const sort = first(sp.sort);
  const dir = first(sp.dir);
  const status = first(sp.status);
  const currency = first(sp.currency);
  const type = first(sp.type);
  const page = Number.parseInt(first(sp.page), 10);

  return {
    q: first(sp.q).slice(0, 80),
    category: first(sp.category),
    status: (["cleared", "pending", "scheduled"] as const).includes(
      status as TransactionStatus
    )
      ? (status as TransactionStatus)
      : "",
    currency: ["USD", "PKR"].includes(currency) ? (currency as CurrencyCode) : "",
    payment: first(sp.payment),
    from: /^\d{4}-\d{2}-\d{2}$/.test(first(sp.from)) ? first(sp.from) : "",
    to: /^\d{4}-\d{2}-\d{2}$/.test(first(sp.to)) ? first(sp.to) : "",
    sort: sort === "amount" ? "amount" : "occurred_on",
    dir: dir === "asc" ? "asc" : "desc",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    type: type === "expense" || type === "income" ? type : "",
  };
}
