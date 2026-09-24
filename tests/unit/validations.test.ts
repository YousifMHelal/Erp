import { describe, expect, it } from "vitest";
import {
  cancelSaleSchema,
  createCollectionSchema,
  createPartySchema,
  createSaleSchema,
  createUserSchema,
  egyptPhoneSchema,
  loginSchema,
  productSchema,
  reportFiltersSchema,
  salesFilterSchema,
  saleLineSchema,
  transferCashSchema,
} from "@/lib/validations";

describe("egyptPhoneSchema", () => {
  it.each(["01012345678", "01212345678", "01512345678", "01112345678"])(
    "accepts a valid Egyptian mobile prefix: %s",
    (phone) => {
      expect(egyptPhoneSchema.safeParse(phone).success).toBe(true);
    },
  );

  it("rejects a landline-style number", () => {
    expect(egyptPhoneSchema.safeParse("0212345678").success).toBe(false);
  });

  it("rejects an invalid prefix (013)", () => {
    expect(egyptPhoneSchema.safeParse("01312345678").success).toBe(false);
  });

  it("rejects a too-short number", () => {
    expect(egyptPhoneSchema.safeParse("0101234567").success).toBe(false);
  });

  it("rejects a too-long number", () => {
    expect(egyptPhoneSchema.safeParse("010123456789").success).toBe(false);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(egyptPhoneSchema.safeParse("  01012345678  ").success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("accepts username + password", () => {
    expect(
      loginSchema.safeParse({ username: "cashier1", password: "x" }).success,
    ).toBe(true);
  });

  it("accepts userId + password (tile mode)", () => {
    expect(
      loginSchema.safeParse({ userId: "clx123", password: "x" }).success,
    ).toBe(true);
  });

  it("rejects when both username and userId are given", () => {
    expect(
      loginSchema.safeParse({
        username: "cashier1",
        userId: "clx123",
        password: "x",
      }).success,
    ).toBe(false);
  });

  it("rejects when neither username nor userId are given", () => {
    expect(loginSchema.safeParse({ password: "x" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(
      loginSchema.safeParse({ username: "cashier1", password: "" }).success,
    ).toBe(false);
  });
});

describe("createUserSchema password complexity", () => {
  const base = {
    username: "cashier1",
    displayName: "كاشير واحد",
    roleId: "role1",
    isActive: true,
  };

  it("accepts a password with upper, lower, digit, and symbol", () => {
    const result = createUserSchema.safeParse({
      ...base,
      password: "Abcdef1!",
      confirmPassword: "Abcdef1!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password missing a symbol", () => {
    const result = createUserSchema.safeParse({
      ...base,
      password: "Abcdef12",
      confirmPassword: "Abcdef12",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password missing an uppercase letter", () => {
    const result = createUserSchema.safeParse({
      ...base,
      password: "abcdef1!",
      confirmPassword: "abcdef1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = createUserSchema.safeParse({
      ...base,
      password: "Ab1!",
      confirmPassword: "Ab1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched confirmPassword, flagged on the confirm field", () => {
    const result = createUserSchema.safeParse({
      ...base,
      password: "Abcdef1!",
      confirmPassword: "Abcdef1?",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects a username starting with a digit", () => {
    const result = createUserSchema.safeParse({
      ...base,
      username: "1cashier",
      password: "Abcdef1!",
      confirmPassword: "Abcdef1!",
    });
    expect(result.success).toBe(false);
  });
});

describe("productSchema", () => {
  const base = {
    sku: "SKU-1",
    name: "منتج تجريبي",
    baseUnitName: "كرتونة",
    subUnitName: "قطعة",
    unitsPerBase: "12",
    purchasePricePerBase: "50",
    sellPricePerBase: "75",
    minStockQty: "5",
    isActive: true,
  };

  it("accepts a valid product with no barcode", () => {
    expect(productSchema.safeParse(base).success).toBe(true);
  });

  it("accepts an empty-string barcode", () => {
    expect(
      productSchema.safeParse({ ...base, barcode: "" }).success,
    ).toBe(true);
  });

  it("accepts a valid numeric barcode", () => {
    expect(
      productSchema.safeParse({ ...base, barcode: "12345678" }).success,
    ).toBe(true);
  });

  it("rejects a non-numeric barcode", () => {
    expect(
      productSchema.safeParse({ ...base, barcode: "abc12345" }).success,
    ).toBe(false);
  });

  it("rejects a sell price of zero (must be positive)", () => {
    expect(
      productSchema.safeParse({ ...base, sellPricePerBase: "0" }).success,
    ).toBe(false);
  });

  it("accepts a purchase price of zero (not required positive)", () => {
    expect(
      productSchema.safeParse({ ...base, purchasePricePerBase: "0" }).success,
    ).toBe(true);
  });

  it("rejects a negative-looking price string", () => {
    expect(
      productSchema.safeParse({ ...base, sellPricePerBase: "-5" }).success,
    ).toBe(false);
  });

  it("rejects more than 4 decimal places on a price", () => {
    expect(
      productSchema.safeParse({ ...base, sellPricePerBase: "10.12345" })
        .success,
    ).toBe(false);
  });
});

describe("saleLineSchema", () => {
  it("accepts a valid BASE line", () => {
    expect(
      saleLineSchema.safeParse({
        productId: "p1",
        unitType: "BASE",
        qtyInUnit: "2",
        unitPrice: "10.5",
      }).success,
    ).toBe(true);
  });

  it("rejects a zero quantity", () => {
    expect(
      saleLineSchema.safeParse({
        productId: "p1",
        unitType: "BASE",
        qtyInUnit: "0",
        unitPrice: "10.5",
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown unit type", () => {
    expect(
      saleLineSchema.safeParse({
        productId: "p1",
        unitType: "CASE",
        qtyInUnit: "2",
        unitPrice: "10.5",
      }).success,
    ).toBe(false);
  });
});

describe("createSaleSchema cross-field rules", () => {
  const line = { productId: "p1", unitType: "BASE" as const, qtyInUnit: "2", unitPrice: "10" };

  it("accepts a fully paid cash sale with no customer", () => {
    const result = createSaleSchema.safeParse({
      cashboxId: "cb1",
      lines: [line],
      discountAmount: "0",
      paidAmount: "20",
    });
    expect(result.success).toBe(true);
  });

  it("rejects paidAmount exceeding the total", () => {
    const result = createSaleSchema.safeParse({
      cashboxId: "cb1",
      lines: [line],
      discountAmount: "0",
      paidAmount: "25",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "paidAmount")).toBe(true);
    }
  });

  it("rejects a discount exceeding the subtotal", () => {
    const result = createSaleSchema.safeParse({
      cashboxId: "cb1",
      lines: [line],
      discountAmount: "999",
      paidAmount: "0",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "discountAmount")).toBe(true);
    }
  });

  it("requires a customer when the sale is left unpaid (credit sale)", () => {
    const result = createSaleSchema.safeParse({
      cashboxId: "cb1",
      lines: [line],
      discountAmount: "0",
      paidAmount: "0",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "customerId")).toBe(true);
    }
  });

  it("allows an unpaid balance when a customer is given (credit sale)", () => {
    const result = createSaleSchema.safeParse({
      customerId: "c1",
      cashboxId: "cb1",
      lines: [line],
      discountAmount: "0",
      paidAmount: "0",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty lines array", () => {
    const result = createSaleSchema.safeParse({
      cashboxId: "cb1",
      lines: [],
      discountAmount: "0",
      paidAmount: "0",
    });
    expect(result.success).toBe(false);
  });
});

describe("cancelSaleSchema", () => {
  it("rejects a reason shorter than 3 characters", () => {
    expect(
      cancelSaleSchema.safeParse({ id: "s1", reason: "no" }).success,
    ).toBe(false);
  });

  it("accepts a valid reason", () => {
    expect(
      cancelSaleSchema.safeParse({ id: "s1", reason: "تم الإلغاء بواسطة العميل" })
        .success,
    ).toBe(true);
  });
});

describe("salesFilterSchema date range", () => {
  it("accepts from before to", () => {
    expect(
      salesFilterSchema.safeParse({ from: "2026-01-01", to: "2026-01-31" })
        .success,
    ).toBe(true);
  });

  it("accepts from equal to to", () => {
    expect(
      salesFilterSchema.safeParse({ from: "2026-01-01", to: "2026-01-01" })
        .success,
    ).toBe(true);
  });

  it("rejects from after to", () => {
    const result = salesFilterSchema.safeParse({
      from: "2026-02-01",
      to: "2026-01-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["to"]);
    }
  });

  it("defaults page and pageSize when omitted", () => {
    const result = salesFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
      expect(result.data.sortBy).toBe("issuedAt");
      expect(result.data.sortDirection).toBe("desc");
    }
  });
});

describe("reportFiltersSchema date range", () => {
  it("rejects from after to", () => {
    expect(
      reportFiltersSchema.safeParse({ from: "2026-02-01", to: "2026-01-01" })
        .success,
    ).toBe(false);
  });
});

describe("transferCashSchema", () => {
  it("rejects transferring a cashbox into itself", () => {
    const result = transferCashSchema.safeParse({
      fromCashboxId: "cb1",
      toCashboxId: "cb1",
      amount: "10",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["toCashboxId"]);
    }
  });

  it("accepts a transfer between two different cashboxes", () => {
    expect(
      transferCashSchema.safeParse({
        fromCashboxId: "cb1",
        toCashboxId: "cb2",
        amount: "10",
      }).success,
    ).toBe(true);
  });

  it("rejects a zero or negative amount", () => {
    expect(
      transferCashSchema.safeParse({
        fromCashboxId: "cb1",
        toCashboxId: "cb2",
        amount: "0",
      }).success,
    ).toBe(false);
  });
});

describe("createCollectionSchema", () => {
  it("accepts a valid collection", () => {
    expect(
      createCollectionSchema.safeParse({
        customerId: "c1",
        cashboxId: "cb1",
        amount: "100",
      }).success,
    ).toBe(true);
  });

  it("rejects a non-positive amount", () => {
    expect(
      createCollectionSchema.safeParse({
        customerId: "c1",
        cashboxId: "cb1",
        amount: "0",
      }).success,
    ).toBe(false);
  });
});

describe("createPartySchema", () => {
  const base = { name: "أحمد محمد" };

  it("accepts an empty-string phone", () => {
    expect(
      createPartySchema.safeParse({ ...base, phone: "", openingBalance: "0" })
        .success,
    ).toBe(true);
  });

  it("accepts a valid phone", () => {
    expect(
      createPartySchema.safeParse({
        ...base,
        phone: "01012345678",
        openingBalance: "0",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid phone when provided", () => {
    expect(
      createPartySchema.safeParse({
        ...base,
        phone: "123",
        openingBalance: "0",
      }).success,
    ).toBe(false);
  });

  it("rejects a negative opening balance (moneyText has no sign)", () => {
    expect(
      createPartySchema.safeParse({ ...base, openingBalance: "-500" }).success,
    ).toBe(false);
  });

  it("accepts a zero or positive opening balance", () => {
    expect(
      createPartySchema.safeParse({ ...base, openingBalance: "500" }).success,
    ).toBe(true);
  });
});
