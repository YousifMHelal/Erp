import { describe, expect, it } from "vitest";
import { shopDateOnly } from "@/lib/format";
import { applyOutbox, operationAmount, searchSnapshotProducts } from "@/lib/offline/overlay";
import type { OfflineSnapshot, OutboxItem, OutboxOperation } from "@/types";

const snapshot: OfflineSnapshot = {
  generatedAt: "2026-09-25T08:00:00.000Z",
  userId: "u1",
  permissions: { sale: true, purchase: true, collection: true, payment: true },
  products: [
    {
      id: "p1",
      name: "Cola Can",
      sku: "COLA-1",
      barcode: "6221234567890",
      baseUnitName: "carton",
      subUnitName: "can",
      unitsPerBase: "24",
      stockQty: "100",
      salePricePerBase: "240",
      salePricePerSub: "10",
      purchasePricePerBase: "192",
      purchasePricePerSub: "8",
    },
    {
      id: "p2",
      name: "Water",
      sku: "WTR-1",
      barcode: null,
      baseUnitName: "pack",
      subUnitName: "bottle",
      unitsPerBase: "6",
      stockQty: "30",
      salePricePerBase: "30",
      salePricePerSub: "5",
      purchasePricePerBase: "24",
      purchasePricePerSub: "4",
    },
  ],
  customers: [{ id: "c1", name: "Ahmed", balance: "50" }],
  suppliers: [{ id: "s1", name: "Supplier", balance: "1000" }],
  cashboxes: [{ id: "k1", name: "Main", balance: "500" }],
};

function queued(operation: OutboxOperation, status: OutboxItem["status"] = "pending"): OutboxItem {
  return {
    ...operation,
    clientRequestId: `id-${Math.random()}`,
    userId: "u1",
    partyName: null,
    amount: operationAmount(operation),
    createdAt: "2026-09-25T09:00:00.000Z",
    status,
    attempts: 0,
  } as OutboxItem;
}

const sale: OutboxOperation = {
  kind: "sale",
  payload: {
    customerId: "c1",
    cashboxId: "k1",
    discountAmount: "0.00",
    paidAmount: "100.00",
    lines: [
      { productId: "p1", unitType: "BASE", qtyInUnit: "1", unitPrice: "240.0000" },
      { productId: "p2", unitType: "SUB", qtyInUnit: "2", unitPrice: "5.0000" },
    ],
  },
};

describe("applyOutbox", () => {
  it("applies a pending sale to stock, cashbox and customer balance", () => {
    const view = applyOutbox(snapshot, [queued(sale)]);
    expect(view.products.find((p) => p.id === "p1")?.stockQty).toBe("76");
    expect(view.products.find((p) => p.id === "p2")?.stockQty).toBe("28");
    expect(view.cashboxes[0]?.balance).toBe("600");
    expect(view.customers[0]?.balance).toBe("200");
  });

  it("applies purchases, collections and payments in the right direction", () => {
    const view = applyOutbox(snapshot, [
      queued({
        kind: "purchase",
        payload: {
          supplierId: "s1",
          cashboxId: "k1",
          discountAmount: "0.00",
          paidAmount: "50.00",
          lines: [{ productId: "p2", unitType: "BASE", qtyInUnit: "2", unitPrice: "24.0000" }],
        },
      }),
      queued({ kind: "collection", payload: { customerId: "c1", cashboxId: "k1", amount: "20" } }),
      queued({ kind: "payment", payload: { supplierId: "s1", cashboxId: "k1", amount: "100" } }),
    ]);
    expect(view.products.find((p) => p.id === "p2")?.stockQty).toBe("42");
    expect(view.cashboxes[0]?.balance).toBe("370");
    expect(view.customers[0]?.balance).toBe("30");
    expect(view.suppliers[0]?.balance).toBe("898");
  });

  it("ignores failed items and leaves the base snapshot untouched", () => {
    const view = applyOutbox(snapshot, [queued(sale, "failed")]);
    expect(view).toBe(snapshot);
    applyOutbox(snapshot, [queued(sale)]);
    expect(snapshot.products[0]?.stockQty).toBe("100");
  });
});

describe("searchSnapshotProducts", () => {
  it("returns an exact barcode match alone, flagged", () => {
    const [only, ...rest] = searchSnapshotProducts(snapshot, " 6221234567890 ", "sale");
    expect(rest).toHaveLength(0);
    expect(only?.exactBarcodeMatch).toBe(true);
    expect(only?.pricePerSub).toBe("10");
  });

  it("matches name or SKU case-insensitively and prices by kind", () => {
    const results = searchSnapshotProducts(snapshot, "wtr", "purchase");
    expect(results.map((p) => p.id)).toEqual(["p2"]);
    expect(results[0]?.pricePerBase).toBe("24");
    expect(results[0]?.exactBarcodeMatch).toBe(false);
  });

  it("lists everything for an empty query", () => {
    expect(searchSnapshotProducts(snapshot, "", "sale")).toHaveLength(2);
  });
});

describe("shopDateOnly", () => {
  it("uses the shop's UTC+2 calendar day", () => {
    expect(shopDateOnly(new Date("2026-09-25T22:30:00.000Z"))).toBe("2026-09-26");
    expect(shopDateOnly(new Date("2026-09-25T21:59:00.000Z"))).toBe("2026-09-25");
  });
});
