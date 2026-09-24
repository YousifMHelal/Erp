import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { decimal, lineAmount, paymentStatus, roundMoney } from "@/lib/money";

describe("roundMoney", () => {
  it("rounds half up to 2 decimal places", () => {
    expect(roundMoney("1.005").toString()).toBe("1.01");
    expect(roundMoney("1.004").toString()).toBe("1");
    expect(roundMoney("1.015").toString()).toBe("1.02");
  });

  it("preserves exact 2-decimal values", () => {
    expect(roundMoney("10.50").toString()).toBe("10.5");
  });
});

describe("lineAmount", () => {
  it("multiplies quantity by unit price and rounds", () => {
    expect(lineAmount(3, "10.005").toString()).toBe("30.02");
  });

  it("handles Decimal precision without float drift", () => {
    // 0.1 + 0.2 style traps that break under Number/Float
    expect(lineAmount("0.1", "0.2").toString()).toBe("0.02");
  });
});

describe("paymentStatus", () => {
  const total = decimal(100);

  it("is PAID when paid equals total", () => {
    expect(paymentStatus(total, decimal(100))).toBe("PAID");
  });

  it("is UNPAID when paid is zero", () => {
    expect(paymentStatus(total, decimal(0))).toBe("UNPAID");
  });

  it("is PARTIAL when paid is between zero and total", () => {
    expect(paymentStatus(total, decimal(40))).toBe("PARTIAL");
  });

  it("treats overpayment as not PAID (falls through to PARTIAL)", () => {
    expect(paymentStatus(total, decimal(150))).toBe("PARTIAL");
  });
});

describe("decimal", () => {
  it("wraps a string, number, or Decimal consistently", () => {
    expect(decimal("5.5")).toBeInstanceOf(Prisma.Decimal);
    expect(decimal(5.5).toString()).toBe("5.5");
  });
});
