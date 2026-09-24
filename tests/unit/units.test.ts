import { describe, expect, it } from "vitest";
import { convertUnitPrice, toBaseUnits, toSubUnits } from "@/lib/units";

describe("toSubUnits", () => {
  it("converts a BASE quantity by the ratio", () => {
    expect(toSubUnits(5, "BASE", 12).toString()).toBe("60");
  });

  it("leaves a SUB quantity unchanged", () => {
    expect(toSubUnits(5, "SUB", 12).toString()).toBe("5");
  });

  it("handles a fractional ratio", () => {
    expect(toSubUnits(2, "BASE", 1.5).toString()).toBe("3");
  });

  it("throws on a non-positive ratio", () => {
    expect(() => toSubUnits(1, "BASE", 0)).toThrow(RangeError);
    expect(() => toSubUnits(1, "BASE", -1)).toThrow(RangeError);
  });
});

describe("toBaseUnits", () => {
  it("divides a sub-unit quantity by the ratio", () => {
    expect(toBaseUnits(60, 12).toString()).toBe("5");
  });

  it("handles a fractional ratio", () => {
    expect(toBaseUnits(3, 1.5).toString()).toBe("2");
  });

  it("throws on a non-positive ratio", () => {
    expect(() => toBaseUnits(1, 0)).toThrow(RangeError);
  });
});

describe("toSubUnits / toBaseUnits round trip", () => {
  it("is inverse for a whole ratio", () => {
    const sub = toSubUnits(5, "BASE", 12);
    expect(toBaseUnits(sub, 12).toString()).toBe("5");
  });
});

describe("convertUnitPrice", () => {
  it("returns the same price when the unit doesn't change", () => {
    expect(convertUnitPrice(10, "SUB", "SUB", 12)).toBe(10);
    expect(convertUnitPrice(120, "BASE", "BASE", 12)).toBe(120);
  });

  it("converts SUB price to BASE by multiplying the ratio", () => {
    expect(convertUnitPrice(10, "SUB", "BASE", 12)).toBe(120);
  });

  it("converts BASE price to SUB by dividing the ratio", () => {
    expect(convertUnitPrice(120, "BASE", "SUB", 12)).toBe(10);
  });

  it("round-trips BASE -> SUB -> BASE", () => {
    const sub = convertUnitPrice(120, "BASE", "SUB", 12);
    expect(convertUnitPrice(sub, "SUB", "BASE", 12)).toBe(120);
  });
});
