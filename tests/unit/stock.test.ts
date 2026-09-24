import { describe, expect, it } from "vitest";
import { canFulfil, stockAfterMovement, stockStatus } from "@/lib/stock";

describe("stockAfterMovement", () => {
  it("adds a positive change", () => {
    expect(stockAfterMovement(10, 5).toString()).toBe("15");
  });

  it("subtracts a negative change", () => {
    expect(stockAfterMovement(10, -5).toString()).toBe("5");
  });

  it("allows landing exactly on zero", () => {
    expect(stockAfterMovement(10, -10).toString()).toBe("0");
  });

  it("throws when the result would go negative", () => {
    expect(() => stockAfterMovement(10, -11)).toThrow("INSUFFICIENT_STOCK");
  });
});

describe("canFulfil", () => {
  it("is true when stock covers the request", () => {
    expect(canFulfil(10, 5)).toBe(true);
  });

  it("is true when stock exactly equals the request", () => {
    expect(canFulfil(10, 10)).toBe(true);
  });

  it("is false when stock is short", () => {
    expect(canFulfil(10, 11)).toBe(false);
  });

  it("is false for a zero or negative request", () => {
    expect(canFulfil(10, 0)).toBe(false);
    expect(canFulfil(10, -1)).toBe(false);
  });
});

describe("stockStatus", () => {
  it("is OUT_OF_STOCK at zero or below", () => {
    expect(stockStatus(0, 5)).toBe("OUT_OF_STOCK");
    expect(stockStatus(-1, 5)).toBe("OUT_OF_STOCK");
  });

  it("is LOW_STOCK at or below the minimum but above zero", () => {
    expect(stockStatus(5, 5)).toBe("LOW_STOCK");
    expect(stockStatus(3, 5)).toBe("LOW_STOCK");
  });

  it("is IN_STOCK above the minimum", () => {
    expect(stockStatus(6, 5)).toBe("IN_STOCK");
  });
});
