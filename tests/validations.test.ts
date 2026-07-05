import { describe, expect, it } from "vitest";
import {
  makeBudgetSchema,
  makeCategorySchema,
  makeLedgerEntrySchema,
  makeLoginSchema,
  makeRegisterSchema,
} from "@/lib/validations";
import { DEMO_USER } from "./demo-credentials";

describe("ledger entry schema", () => {
  const schema = makeLedgerEntrySchema();
  const valid = {
    amount: "49.99",
    currency: "USD",
    description: "Weekly groceries",
    occurred_on: "2026-07-01",
    status: "cleared",
  };

  it("accepts a valid entry and coerces the amount", () => {
    const parsed = schema.parse(valid);
    expect(parsed.amount).toBe(49.99);
    expect(parsed.currency).toBe("USD");
  });

  it("rejects non-positive amounts", () => {
    expect(schema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
    expect(schema.safeParse({ ...valid, amount: -5 }).success).toBe(false);
  });

  it("rejects unknown currencies", () => {
    expect(schema.safeParse({ ...valid, currency: "EUR" }).success).toBe(false);
  });

  it("rejects malformed dates", () => {
    expect(schema.safeParse({ ...valid, occurred_on: "01/07/2026" }).success).toBe(false);
  });

  it("requires a description", () => {
    expect(schema.safeParse({ ...valid, description: "" }).success).toBe(false);
  });

  it("returns the translated message key on failure", () => {
    const t = (key: string) => `translated:${key}`;
    const result = makeLedgerEntrySchema(t).safeParse({ ...valid, amount: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("translated:amountPositive");
    }
  });
});

describe("budget schema", () => {
  const schema = makeBudgetSchema();

  it("bounds the alert threshold to 1–100", () => {
    const base = { name: "Food", period: "monthly", amount: 100, currency: "USD" };
    expect(schema.safeParse({ ...base, alert_threshold: 80 }).success).toBe(true);
    expect(schema.safeParse({ ...base, alert_threshold: 0 }).success).toBe(false);
    expect(schema.safeParse({ ...base, alert_threshold: 101 }).success).toBe(false);
  });
});

describe("category schema", () => {
  const schema = makeCategorySchema();

  it("requires a hex color", () => {
    const base = { name: "Pets", kind: "expense", icon: "paw-print" };
    expect(schema.safeParse({ ...base, color: "#177154" }).success).toBe(true);
    expect(schema.safeParse({ ...base, color: "green" }).success).toBe(false);
  });
});

describe("auth schemas (demo account)", () => {
  it("accepts the seeded demo credentials", () => {
    const result = makeLoginSchema().safeParse({
      email: DEMO_USER.email,
      password: DEMO_USER.password,
    });
    expect(result.success).toBe(true);
  });

  it("rejects malformed emails and short passwords", () => {
    const schema = makeLoginSchema();
    expect(schema.safeParse({ email: "nope", password: DEMO_USER.password }).success).toBe(false);
    expect(schema.safeParse({ email: DEMO_USER.email, password: "short" }).success).toBe(false);
  });

  it("register requires matching password confirmation", () => {
    const schema = makeRegisterSchema();
    const base = {
      full_name: DEMO_USER.username,
      email: DEMO_USER.email,
      password: DEMO_USER.password,
    };
    expect(schema.safeParse({ ...base, confirm: DEMO_USER.password }).success).toBe(true);
    expect(schema.safeParse({ ...base, confirm: "Different1" }).success).toBe(false);
  });
});
