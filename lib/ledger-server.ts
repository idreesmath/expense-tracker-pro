import { createClient } from "@/lib/supabase/server";
import { LEDGER_PAGE_SIZE, type LedgerFilters } from "@/lib/ledger-query";
import type { Transaction, TransactionType } from "@/types/database";

/**
 * Server-side ledger query shared by the Expenses, Income and
 * Transactions pages: full-text-ish search, filters, sort, pagination.
 */
export async function fetchLedger(
  filters: LedgerFilters,
  kind?: TransactionType
): Promise<{ rows: Transaction[]; total: number }> {
  const supabase = await createClient();

  const source = kind
    ? kind === "expense"
      ? "expenses"
      : "income"
    : "transactions";

  let query = supabase
    .from(source as "transactions")
    .select("*", { count: "exact" });

  if (!kind && filters.type) query = query.eq("type", filters.type);
  if (filters.category) query = query.eq("category_id", filters.category);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.currency) query = query.eq("currency", filters.currency);
  if (filters.payment) query = query.eq("payment_method_id", filters.payment);
  if (filters.from) query = query.gte("occurred_on", filters.from);
  if (filters.to) query = query.lte("occurred_on", filters.to);

  if (filters.q) {
    const like = `%${filters.q.replaceAll("%", "").replaceAll(",", "")}%`;
    const clauses = [
      `description.ilike.${like}`,
      `notes.ilike.${like}`,
      `sub_category.ilike.${like}`,
    ];
    const numeric = Number(filters.q);
    if (Number.isFinite(numeric) && numeric > 0) {
      clauses.push(`amount.eq.${numeric}`);
    }
    query = query.or(clauses.join(","));
  }

  const fromRow = (filters.page - 1) * LEDGER_PAGE_SIZE;
  const { data, count } = await query
    .order(filters.sort, { ascending: filters.dir === "asc" })
    .order("created_at", { ascending: false })
    .range(fromRow, fromRow + LEDGER_PAGE_SIZE - 1);

  const rows: Transaction[] = (data ?? []).map((row) =>
    "type" in row
      ? (row as Transaction)
      : ({ ...(row as Transaction), type: kind! } as Transaction)
  );

  return { rows, total: count ?? 0 };
}
