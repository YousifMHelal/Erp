import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { cancelPurchase, createPurchase, updatePurchase } from "@/actions/purchases.actions";
import {
  asUser,
  createScratchCashbox,
  createScratchProduct,
  createScratchSupplier,
  purgeCashbox,
  purgeInvoice,
  purgeOrphanedLedgerRows,
  purgeProduct,
  purgeSupplier,
} from "./helpers";

describe("purchase transactions move stock (with weighted-avg cost), cash, and supplier balance atomically", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a cash purchase: stock increases, cashbox decreases, avg cost recomputed", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 10, avgCostPerSub: 5 });
    const cashbox = await createScratchCashbox({ balance: 500 });
    let invoiceId: string | undefined;
    try {
      // Buy 10 more units @ cost 15/unit. Weighted avg: (10*5 + 10*15) / 20 = 10.
      const result = await createPurchase({
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "10", unitPrice: "15" }],
        discountAmount: "0",
        paidAmount: "150",
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      invoiceId = result.data.id;

      const productAfter = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      expect(productAfter.stockQty.toString()).toBe("20");
      expect(productAfter.avgCostPerSub.toString()).toBe("10");
      expect(cashboxAfter.balance.toString()).toBe("350");
    } finally {
      if (invoiceId) await purgeInvoice(invoiceId);
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
    }
  });

  it("creates a credit purchase: supplier balance increases by the remaining amount", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 0, avgCostPerSub: 0 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    const supplier = await createScratchSupplier({ balance: 0 });
    let invoiceId: string | undefined;
    try {
      const result = await createPurchase({
        supplierId: supplier.id,
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "5", unitPrice: "8" }],
        discountAmount: "0",
        paidAmount: "10",
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      invoiceId = result.data.id;

      const supplierAfter = await prisma.supplier.findUniqueOrThrow({ where: { id: supplier.id } });
      // total = 40, paid = 10, remaining = 30
      expect(supplierAfter.balance.toString()).toBe("30");
    } finally {
      if (invoiceId) await purgeInvoice(invoiceId);
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
      await purgeSupplier(supplier.id);
    }
  });

  it("cancelling a purchase reverses stock and cash without re-deriving avg cost, then removes the invoice row", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 10, avgCostPerSub: 5 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    let invoiceId: string | undefined;
    try {
      const created = await createPurchase({
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "10", unitPrice: "15" }],
        discountAmount: "0",
        paidAmount: "150",
      });
      if (!created.success) throw new Error("setup failed");
      invoiceId = created.data.id;

      const afterCreate = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(afterCreate.stockQty.toString()).toBe("20");
      expect(afterCreate.avgCostPerSub.toString()).toBe("10");

      const cancelled = await cancelPurchase({ id: invoiceId, reason: "اختبار الإلغاء" });
      expect(cancelled.success).toBe(true);

      const productAfter = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      // Stock returns to 10, but avg cost is NOT re-derived from a negative quantity — stays at the post-purchase value.
      expect(productAfter.stockQty.toString()).toBe("10");
      expect(productAfter.avgCostPerSub.toString()).toBe("10");
      expect(cashboxAfter.balance.toString()).toBe("0");

      const invoiceRow = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      expect(invoiceRow).toBeNull();
      invoiceId = undefined;
    } finally {
      if (invoiceId) await purgeInvoice(invoiceId);
      await purgeOrphanedLedgerRows({ productIds: [product.id], cashboxIds: [cashbox.id] });
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
    }
  });

  it("rejects cancelling an already-cancelled purchase", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 5, avgCostPerSub: 5 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    try {
      const created = await createPurchase({
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "1", unitPrice: "10" }],
        discountAmount: "0",
        paidAmount: "10",
      });
      if (!created.success) throw new Error("setup failed");
      const first = await cancelPurchase({ id: created.data.id, reason: "أول إلغاء" });
      expect(first.success).toBe(true);
      const second = await cancelPurchase({ id: created.data.id, reason: "إلغاء ثانٍ" });
      expect(second.success).toBe(false);
    } finally {
      await purgeOrphanedLedgerRows({ productIds: [product.id], cashboxIds: [cashbox.id] });
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
    }
  });

  it("editing a purchase reverses the old lines and reapplies the new ones", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 0, avgCostPerSub: 0 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    let invoiceId: string | undefined;
    try {
      const created = await createPurchase({
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "5", unitPrice: "10" }],
        discountAmount: "0",
        paidAmount: "50",
      });
      if (!created.success) throw new Error("setup failed");
      invoiceId = created.data.id;

      const invoiceRow = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
      const edited = await updatePurchase({
        id: invoiceId,
        updatedAt: invoiceRow.updatedAt,
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "8", unitPrice: "10" }],
        discountAmount: "0",
        paidAmount: "80",
      });
      expect(edited.success).toBe(true);

      const afterEdit = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(afterEdit.stockQty.toString()).toBe("8");

      const currentLines = await prisma.invoiceLine.findMany({ where: { invoiceId, isCurrent: true } });
      expect(currentLines).toHaveLength(1);
      expect(currentLines[0]?.qtyInSub.toString()).toBe("8");
    } finally {
      if (invoiceId) await purgeInvoice(invoiceId);
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
    }
  });

  it("rejects a purchase.create for a role that lacks it (cashier)", async () => {
    await asUser("cashier1");
    const product = await createScratchProduct({ stockQty: 0 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    try {
      const result = await createPurchase({
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "1", unitPrice: "10" }],
        discountAmount: "0",
        paidAmount: "10",
      });
      expect(result.success).toBe(false); // cashier has no purchase.create
    } finally {
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
    }
  });
});
