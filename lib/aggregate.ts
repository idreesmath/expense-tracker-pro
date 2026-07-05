import type { CurrencyCode } from "@/types/database";

/**
 * Mixed-currency aggregation: the server sums per currency and ships a
 * tiny "bag" to the client, which converts to the display currency —
 * so switching currency recalculates everything without a refetch.
 */
export type MoneyBag = Record<CurrencyCode, number>;

export const emptyBag = (): MoneyBag => ({ USD: 0, PKR: 0 });

export function addToBag(
  bag: MoneyBag,
  amount: number,
  currency: CurrencyCode
): MoneyBag {
  bag[currency] += amount;
  return bag;
}

export function bagFromRows(
  rows: ReadonlyArray<{ amount: number | string; currency: CurrencyCode }>
): MoneyBag {
  return rows.reduce(
    (bag, row) => addToBag(bag, Number(row.amount), row.currency),
    emptyBag()
  );
}

/** Convert a bag to a single number in the display currency. */
export function bagTotal(
  bag: MoneyBag,
  toDisplay: (amount: number, from: CurrencyCode) => number
): number {
  return toDisplay(bag.USD, "USD") + toDisplay(bag.PKR, "PKR");
}
