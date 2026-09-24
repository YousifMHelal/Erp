import { describe, expect, it } from "vitest";
import { chooseSuggestedPrice } from "@/lib/pricing";

describe("chooseSuggestedPrice", () => {
  it("prefers the customer's last price when present", () => {
    const result = chooseSuggestedPrice(15, 12, 10);
    expect(result.source).toBe("customer");
    expect(result.pricePerSub.toString()).toBe("15");
  });

  it("falls back to the recent price when there's no customer price", () => {
    const result = chooseSuggestedPrice(null, 12, 10);
    expect(result.source).toBe("recent");
    expect(result.pricePerSub.toString()).toBe("12");
  });

  it("falls back to the catalogue price when neither customer nor recent price exists", () => {
    const result = chooseSuggestedPrice(null, null, 10);
    expect(result.source).toBe("catalogue");
    expect(result.pricePerSub.toString()).toBe("10");
  });

  it("treats a customer price of 0 as present, not falsy", () => {
    const result = chooseSuggestedPrice(0, 12, 10);
    expect(result.source).toBe("customer");
    expect(result.pricePerSub.toString()).toBe("0");
  });
});
