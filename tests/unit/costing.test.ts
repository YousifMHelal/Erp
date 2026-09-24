import { describe, expect, it } from "vitest";
import { weightedAverageCost } from "@/lib/costing";

describe("weightedAverageCost", () => {
  it("returns the incoming cost when there was no prior stock", () => {
    expect(weightedAverageCost(0, 0, 10, 5).toString()).toBe("5");
  });

  it("computes the weighted average across a purchase sequence", () => {
    // 10 units @ 5 already in stock, buy 10 more @ 7 -> avg 6
    const afterFirst = weightedAverageCost(10, 5, 10, 7);
    expect(afterFirst.toString()).toBe("6");

    // 20 units @ 6 now in stock, buy 5 more @ 12 -> (20*6 + 5*12) / 25 = 7.2
    const afterSecond = weightedAverageCost(20, afterFirst, 5, 12);
    expect(afterSecond.toString()).toBe("7.2");
  });

  it("rounds to 4 decimal places, half up", () => {
    // (1*1 + 1*2) / 3 = 1.0000... repeating -> 1.6667 half up? actually 1*1+1*2=3/... use a case with repeating
    const result = weightedAverageCost(1, 1, 2, 2);
    // (1*1 + 2*2)/3 = 5/3 = 1.66666... -> 1.6667
    expect(result.toString()).toBe("1.6667");
  });

  it("throws when old quantity is negative", () => {
    expect(() => weightedAverageCost(-1, 5, 10, 5)).toThrow(RangeError);
  });

  it("throws when incoming quantity is zero or negative", () => {
    expect(() => weightedAverageCost(10, 5, 0, 5)).toThrow(RangeError);
    expect(() => weightedAverageCost(10, 5, -5, 5)).toThrow(RangeError);
  });

  it("allows zero old quantity (first purchase ever)", () => {
    expect(() => weightedAverageCost(0, 0, 5, 3)).not.toThrow();
  });
});
