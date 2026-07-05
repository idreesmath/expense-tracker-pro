import { describe, expect, it } from "vitest";
import {
  convert,
  formatMoney,
  roundMoney,
  sumInCurrency,
  type RateMap,
} from "@/lib/currency";
import { bagFromRows, bagTotal, emptyBag, addToBag } from "@/lib/aggregate";

// Fixed test rates: 1 USD = 250 PKR (rate_to_usd of PKR = 1/250)
const RATES: RateMap = { USD: 1, PKR: 0.004 };

describe("convert", () => {
  it("is identity for the same currency", () => {
    expect(convert(123.45, "USD", "USD", RATES)).toBe(123.45);
    expect(convert(999, "PKR", "PKR", RATES)).toBe(999);
  });

  it("converts USD to PKR through the anchor", () => {
    expect(convert(10, "USD", "PKR", RATES)).toBe(2500);
  });

  it("converts PKR to USD through the anchor", () => {
    expect(convert(2500, "PKR", "USD", RATES)).toBe(10);
  });

  it("round-trips within a cent", () => {
    const usd = 1234.56;
    const back = convert(convert(usd, "USD", "PKR", RATES), "PKR", "USD", RATES);
    expect(Math.abs(back - usd)).toBeLessThan(0.01);
  });

  it("rounds to two decimals", () => {
    expect(convert(1, "PKR", "USD", RATES)).toBe(0); // 0.004 → 0.00
    expect(convert(3, "PKR", "USD", RATES)).toBe(0.01); // 0.012 → 0.01
  });
});

describe("roundMoney", () => {
  it("half-up rounds to cents", () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(1.004)).toBe(1.0);
    expect(roundMoney(-1.004)).toBe(-1.0);
  });
});

describe("sumInCurrency", () => {
  it("sums mixed-currency items into the display currency", () => {
    const items = [
      { amount: 10, currency: "USD" as const },
      { amount: 2500, currency: "PKR" as const },
    ];
    expect(sumInCurrency(items, "USD", RATES)).toBe(20);
    expect(sumInCurrency(items, "PKR", RATES)).toBe(5000);
  });

  it("returns 0 for an empty ledger", () => {
    expect(sumInCurrency([], "USD", RATES)).toBe(0);
  });
});

describe("money bags", () => {
  it("aggregates rows by currency then totals in display units", () => {
    const bag = bagFromRows([
      { amount: 5, currency: "USD" },
      { amount: "7.5", currency: "USD" },
      { amount: 1000, currency: "PKR" },
    ]);
    expect(bag.USD).toBe(12.5);
    expect(bag.PKR).toBe(1000);

    const toDisplay = (amount: number, from: "USD" | "PKR") =>
      convert(amount, from, "USD", RATES);
    expect(bagTotal(bag, toDisplay)).toBe(16.5);
  });

  it("addToBag mutates the right slot", () => {
    const bag = emptyBag();
    addToBag(bag, 3, "PKR");
    addToBag(bag, 4, "PKR");
    expect(bag).toEqual({ USD: 0, PKR: 7 });
  });
});

describe("formatMoney", () => {
  it("formats USD for the English locale", () => {
    expect(formatMoney(1234.5, "USD", "en")).toBe("$1,234.50");
  });

  it("uses the ₨ sign for PKR", () => {
    expect(formatMoney(1000, "PKR", "en")).toContain("₨");
  });

  it("supports forced signs for ledger deltas", () => {
    expect(formatMoney(5, "USD", "en", { signDisplay: "always" })).toContain("+");
  });
});
