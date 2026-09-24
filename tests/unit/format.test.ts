import { describe, expect, it } from "vitest";
import {
  formatMoney,
  formatMoneyInWords,
  formatNumber,
  numberToArabicWords,
  toDateInputValue,
} from "@/lib/format";

describe("formatMoney", () => {
  it("formats with thousands separators and the currency suffix", () => {
    expect(formatMoney("34890")).toBe("34,890.00 ج.م");
  });

  it("formats a negative value with the minus sign before the number", () => {
    expect(formatMoney("-150.5")).toBe("−150.50 ج.م");
  });

  it("formats zero", () => {
    expect(formatMoney("0")).toBe("0.00 ج.م");
  });
});

describe("formatNumber", () => {
  it("trims trailing zero decimals", () => {
    expect(formatNumber("10.000")).toBe("10");
  });

  it("keeps significant decimals up to the given precision", () => {
    expect(formatNumber("10.5", 3)).toBe("10.5");
  });

  it("groups thousands", () => {
    expect(formatNumber("12345.5", 1)).toBe("12,345.5");
  });
});

describe("toDateInputValue", () => {
  it("formats using the local calendar date, not UTC", () => {
    const date = new Date(2026, 0, 5); // 5 Jan 2026 local time
    expect(toDateInputValue(date)).toBe("2026-01-05");
  });

  it("returns undefined for an undefined or invalid date", () => {
    expect(toDateInputValue(undefined)).toBeUndefined();
    expect(toDateInputValue(new Date("invalid"))).toBeUndefined();
  });
});

describe("numberToArabicWords", () => {
  it("converts zero", () => {
    expect(numberToArabicWords(0)).toBe("صفر");
  });

  it("converts a simple ones value", () => {
    expect(numberToArabicWords(5)).toBe("خمسة");
  });

  it("converts a teen value", () => {
    expect(numberToArabicWords(15)).toBe("خمسة عشر");
  });

  it("converts a hundreds value with remainder", () => {
    expect(numberToArabicWords(125)).toBe("مائة وخمسة وعشرون");
  });

  it("converts a thousands value", () => {
    expect(numberToArabicWords(2000)).toBe("ألفان");
  });

  it("converts a large mixed value", () => {
    expect(numberToArabicWords(1234)).toBe("ألف ومائتان وأربعة وثلاثون");
  });
});

describe("formatMoneyInWords", () => {
  it("formats a whole amount without a fraction clause", () => {
    expect(formatMoneyInWords("5")).toBe("خمسة جنيه");
  });

  it("appends the قرش clause when there's a fraction", () => {
    expect(formatMoneyInWords("5.50")).toBe("خمسة جنيه وخمسون قرش");
  });
});
