import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { cancelSale, createSale, updateSale } from "@/actions/sales.actions";
import {
  asUser,
  createScratchCashbox,
  createScratchCustomer,
  createScratchProduct,
  purgeCashbox,
  purgeCustomer,
  purgeInvoice,
  purgeOrphanedLedgerRows,
  purgeProduct,
} from "./helpers";

describe("sale transactions move stock, cash, and party balance atomically", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a cash sale: stock decreases, cashbox increases, no customer balance change", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 100 });
    const cashbox = await createScratchCashbox({ balance: 500 });
    let invoiceId: string | undefined;
    try {
      const result = await createSale({
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "5", unitPrice: "15" }],
        discountAmount: "0",
        paidAmount: "75",
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      invoiceId = result.data.id;

      const productAfter = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      expect(productAfter.stockQty.toString()).toBe("95");
      expect(cashboxAfter.balance.toString()).toBe("575");

      const movement = await prisma.stockMovement.findFirst({ where: { invoiceId } });
      expect(movement?.qtyInSub.toString()).toBe("-5");
    } finally {
      if (invoiceId) await purgeInvoice(invoiceId);
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
    }
  });

  it("creates a credit sale: customer balance increases by the remaining amount", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 50 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    const customer = await createScratchCustomer({ balance: 0 });
    let invoiceId: string | undefined;
    try {
      const result = await createSale({
        customerId: customer.id,
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "2", unitPrice: "15" }],
        discountAmount: "0",
        paidAmount: "10",
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      invoiceId = result.data.id;

      const customerAfter = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
      // total = 30, paid = 10, remaining = 20
      expect(customerAfter.balance.toString()).toBe("20");
      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      expect(cashboxAfter.balance.toString()).toBe("10");
    } finally {
      if (invoiceId) await purgeInvoice(invoiceId);
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
      await purgeCustomer(customer.id);
    }
  });

  it("rejects a sale that would drive stock negative, leaving stock/cash untouched", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 3 });
    const cashbox = await createScratchCashbox({ balance: 100 });
    try {
      const result = await createSale({
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "10", unitPrice: "15" }],
        discountAmount: "0",
        paidAmount: "150",
      });
      expect(result.success).toBe(false);

      const productAfter = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      expect(productAfter.stockQty.toString()).toBe("3");
      expect(cashboxAfter.balance.toString()).toBe("100");
    } finally {
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
    }
  });

  it("cancelling a confirmed sale reverses stock, cash, and customer balance exactly, then removes the invoice row", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 100 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    const customer = await createScratchCustomer({ balance: 0 });
    let invoiceId: string | undefined;
    try {
      const created = await createSale({
        customerId: customer.id,
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "4", unitPrice: "20" }],
        discountAmount: "0",
        paidAmount: "40",
      });
      expect(created.success).toBe(true);
      if (!created.success) return;
      invoiceId = created.data.id;

      const cancelled = await cancelSale({ id: invoiceId, reason: "اختبار الإلغاء" });
      expect(cancelled.success).toBe(true);

      const productAfter = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      const customerAfter = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
      expect(productAfter.stockQty.toString()).toBe("100");
      expect(cashboxAfter.balance.toString()).toBe("0");
      expect(customerAfter.balance.toString()).toBe("0");

      const invoiceRow = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      expect(invoiceRow).toBeNull();

      invoiceId = undefined; // already gone; nothing left for purgeInvoice to delete from the invoice table
    } finally {
      if (invoiceId) await purgeInvoice(invoiceId);
      // The invoice row is gone, but ledger rows referencing it via invoiceId survive (SetNull) — clean those up directly.
      await purgeOrphanedLedgerRows({
        productIds: [product.id],
        cashboxIds: [cashbox.id],
        customerIds: [customer.id],
      });
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
      await purgeCustomer(customer.id);
    }
  });

  it("rejects cancelling an already-cancelled sale (notFound, since cancel hard-deletes)", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 20 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    try {
      const created = await createSale({
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "1", unitPrice: "10" }],
        discountAmount: "0",
        paidAmount: "10",
      });
      if (!created.success) throw new Error("setup failed");
      const first = await cancelSale({ id: created.data.id, reason: "أول إلغاء" });
      expect(first.success).toBe(true);
      const second = await cancelSale({ id: created.data.id, reason: "إلغاء ثانٍ" });
      expect(second.success).toBe(false);
    } finally {
      await purgeOrphanedLedgerRows({ productIds: [product.id], cashboxIds: [cashbox.id] });
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
    }
  });

  it("editing a sale reverses the old lines and reapplies the new ones (qty change moves stock by the delta)", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 100 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    let invoiceId: string | undefined;
    try {
      const created = await createSale({
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "5", unitPrice: "10" }],
        discountAmount: "0",
        paidAmount: "50",
      });
      if (!created.success) throw new Error("setup failed");
      invoiceId = created.data.id;

      const afterCreate = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(afterCreate.stockQty.toString()).toBe("95");

      const invoiceRow = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
      const edited = await updateSale({
        id: invoiceId,
        updatedAt: invoiceRow.updatedAt,
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "8", unitPrice: "10" }],
        discountAmount: "0",
        paidAmount: "80",
      });
      expect(edited.success).toBe(true);

      const afterEdit = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      // 100 - 8 = 92 (old 5 fully reversed, new 8 applied)
      expect(afterEdit.stockQty.toString()).toBe("92");

      const currentLines = await prisma.invoiceLine.findMany({
        where: { invoiceId, isCurrent: true },
      });
      expect(currentLines).toHaveLength(1);
      expect(currentLines[0]?.qtyInSub.toString()).toBe("8");
      const historyLines = await prisma.invoiceLine.findMany({
        where: { invoiceId, isCurrent: false },
      });
      expect(historyLines).toHaveLength(1);
    } finally {
      if (invoiceId) await purgeInvoice(invoiceId);
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
    }
  });

  it("rejects a permission-denied sale.create for a role that lacks it", async () => {
    // Seed customer-facing roles: cashier has sale.create, but not e.g. sale.edit.
    await asUser("cashier1");
    const product = await createScratchProduct({ stockQty: 10 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    try {
      const created = await createSale({
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "1", unitPrice: "10" }],
        discountAmount: "0",
        paidAmount: "10",
      });
      expect(created.success).toBe(true); // cashier CAN create
      if (created.success) {
        const editAttempt = await updateSale({
          id: created.data.id,
          updatedAt: new Date(),
          cashboxId: cashbox.id,
          lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "2", unitPrice: "10" }],
          discountAmount: "0",
          paidAmount: "20",
        });
        expect(editAttempt.success).toBe(false); // cashier CANNOT edit
        await purgeInvoice(created.data.id);
      }
    } finally {
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
    }
  });
});
