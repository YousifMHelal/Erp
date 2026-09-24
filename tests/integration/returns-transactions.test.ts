import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createSale, cancelSale } from "@/actions/sales.actions";
import { createPurchase } from "@/actions/purchases.actions";
import { cancelReturn, createPurchaseReturn, createSaleReturn } from "@/actions/returns.actions";
import {
  asUser,
  createScratchCashbox,
  createScratchCustomer,
  createScratchProduct,
  createScratchSupplier,
  purgeCashbox,
  purgeCustomer,
  purgeInvoice,
  purgeOrphanedLedgerRows,
  purgeProduct,
  purgeSupplier,
} from "./helpers";

describe("sale return transactions", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returning part of a paid sale: stock increases back, cashbox refunds cash", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 100 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    let saleId: string | undefined;
    let returnId: string | undefined;
    try {
      const sale = await createSale({
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "10", unitPrice: "20" }],
        discountAmount: "0",
        paidAmount: "200",
      });
      if (!sale.success) throw new Error("setup failed");
      saleId = sale.data.id;

      const afterSale = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(afterSale.stockQty.toString()).toBe("90");

      const ret = await createSaleReturn({
        originalInvoiceId: saleId,
        cashboxId: cashbox.id,
        settleFromCashbox: true,
        lines: [{ productId: product.id, qtyInSub: "4" }],
      });
      expect(ret.success).toBe(true);
      if (!ret.success) return;
      returnId = ret.data.id;

      const afterReturn = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      // 90 + 4 returned = 94; cash: 200 paid - 80 refunded (4 * 20) = 120
      expect(afterReturn.stockQty.toString()).toBe("94");
      expect(cashboxAfter.balance.toString()).toBe("120");
    } finally {
      if (returnId) await purgeInvoice(returnId);
      if (saleId) await purgeInvoice(saleId);
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
    }
  });

  it("caps total returned quantity across multiple returns at what was actually sold", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 100 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    let saleId: string | undefined;
    let firstReturnId: string | undefined;
    try {
      const sale = await createSale({
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "10", unitPrice: "20" }],
        discountAmount: "0",
        paidAmount: "200",
      });
      if (!sale.success) throw new Error("setup failed");
      saleId = sale.data.id;

      const first = await createSaleReturn({
        originalInvoiceId: saleId,
        cashboxId: cashbox.id,
        settleFromCashbox: true,
        lines: [{ productId: product.id, qtyInSub: "7" }],
      });
      expect(first.success).toBe(true);
      if (first.success) firstReturnId = first.data.id;

      // Only 3 remain returnable (10 - 7); asking for 5 more must be rejected.
      const second = await createSaleReturn({
        originalInvoiceId: saleId,
        cashboxId: cashbox.id,
        settleFromCashbox: true,
        lines: [{ productId: product.id, qtyInSub: "5" }],
      });
      expect(second.success).toBe(false);

      // Exactly the remaining 3 should succeed.
      const third = await createSaleReturn({
        originalInvoiceId: saleId,
        cashboxId: cashbox.id,
        settleFromCashbox: true,
        lines: [{ productId: product.id, qtyInSub: "3" }],
      });
      expect(third.success).toBe(true);
      if (third.success) await purgeInvoice(third.data.id);
    } finally {
      if (firstReturnId) await purgeInvoice(firstReturnId);
      if (saleId) await purgeInvoice(saleId);
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
    }
  });

  it("a return can adjust the customer balance instead of cash (settleFromCashbox=false)", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 100 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    const customer = await createScratchCustomer({ balance: 0 });
    let saleId: string | undefined;
    let returnId: string | undefined;
    try {
      const sale = await createSale({
        customerId: customer.id,
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "10", unitPrice: "20" }],
        discountAmount: "0",
        paidAmount: "0",
      });
      if (!sale.success) throw new Error("setup failed");
      saleId = sale.data.id;
      const customerAfterSale = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
      expect(customerAfterSale.balance.toString()).toBe("200");

      const ret = await createSaleReturn({
        originalInvoiceId: saleId,
        cashboxId: cashbox.id,
        settleFromCashbox: false,
        lines: [{ productId: product.id, qtyInSub: "4" }],
      });
      expect(ret.success).toBe(true);
      if (ret.success) returnId = ret.data.id;

      const customerAfterReturn = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      // 200 - 80 (4 * 20) = 120; cashbox untouched
      expect(customerAfterReturn.balance.toString()).toBe("120");
      expect(cashboxAfter.balance.toString()).toBe("0");
    } finally {
      if (returnId) await purgeInvoice(returnId);
      if (saleId) await purgeInvoice(saleId);
      await purgeOrphanedLedgerRows({ customerIds: [customer.id] });
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
      await purgeCustomer(customer.id);
    }
  });

  it("cancelling a return reverses stock and cash, then removes the return's invoice row", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 100 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    let saleId: string | undefined;
    let returnId: string | undefined;
    try {
      const sale = await createSale({
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "10", unitPrice: "20" }],
        discountAmount: "0",
        paidAmount: "200",
      });
      if (!sale.success) throw new Error("setup failed");
      saleId = sale.data.id;

      const ret = await createSaleReturn({
        originalInvoiceId: saleId,
        cashboxId: cashbox.id,
        settleFromCashbox: true,
        lines: [{ productId: product.id, qtyInSub: "4" }],
      });
      if (!ret.success) throw new Error("setup failed");
      returnId = ret.data.id;

      const afterReturn = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(afterReturn.stockQty.toString()).toBe("94");

      const cancelled = await cancelReturn({ id: returnId, reason: "اختبار إلغاء المرتجع" });
      expect(cancelled.success).toBe(true);

      const afterCancel = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      expect(afterCancel.stockQty.toString()).toBe("90");
      expect(cashboxAfter.balance.toString()).toBe("200");

      const returnRow = await prisma.invoice.findUnique({ where: { id: returnId } });
      expect(returnRow).toBeNull();
      returnId = undefined;
    } finally {
      if (returnId) await purgeInvoice(returnId);
      if (saleId) await purgeInvoice(saleId);
      await purgeOrphanedLedgerRows({ productIds: [product.id], cashboxIds: [cashbox.id] });
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
    }
  });

  it("rejects a return against a cancelled original sale", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 100 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    let saleId: string | undefined;
    try {
      const sale = await createSale({
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "5", unitPrice: "20" }],
        discountAmount: "0",
        paidAmount: "100",
      });
      if (!sale.success) throw new Error("setup failed");
      saleId = sale.data.id;
      const cancelled = await cancelSale({ id: saleId, reason: "اختبار" });
      expect(cancelled.success).toBe(true);
      saleId = undefined; // invoice hard-deleted by cancelSale

      const ret = await createSaleReturn({
        originalInvoiceId: cancelled.success ? cancelled.data.id : "",
        cashboxId: cashbox.id,
        settleFromCashbox: true,
        lines: [{ productId: product.id, qtyInSub: "1" }],
      });
      expect(ret.success).toBe(false);
    } finally {
      if (saleId) await purgeInvoice(saleId);
      await purgeOrphanedLedgerRows({ productIds: [product.id], cashboxIds: [cashbox.id] });
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
    }
  });
});

describe("purchase return transactions", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returning part of a purchase: stock decreases, cashbox receives cash back", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 0, avgCostPerSub: 0 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    let purchaseId: string | undefined;
    let returnId: string | undefined;
    try {
      const purchase = await createPurchase({
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "10", unitPrice: "20" }],
        discountAmount: "0",
        paidAmount: "200",
      });
      if (!purchase.success) throw new Error("setup failed");
      purchaseId = purchase.data.id;

      const ret = await createPurchaseReturn({
        originalInvoiceId: purchaseId,
        cashboxId: cashbox.id,
        settleFromCashbox: true,
        lines: [{ productId: product.id, qtyInSub: "3" }],
      });
      expect(ret.success).toBe(true);
      if (!ret.success) return;
      returnId = ret.data.id;

      const productAfter = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      // 10 - 3 = 7 stock; cashbox: -200 (paid) + 60 (3*20 back) = -140
      expect(productAfter.stockQty.toString()).toBe("7");
      expect(cashboxAfter.balance.toString()).toBe("-140");
    } finally {
      if (returnId) await purgeInvoice(returnId);
      if (purchaseId) await purgeInvoice(purchaseId);
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
    }
  });

  it("a purchase return can reduce the supplier balance instead of cash", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 0, avgCostPerSub: 0 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    const supplier = await createScratchSupplier({ balance: 0 });
    let purchaseId: string | undefined;
    let returnId: string | undefined;
    try {
      const purchase = await createPurchase({
        supplierId: supplier.id,
        cashboxId: cashbox.id,
        lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: "10", unitPrice: "20" }],
        discountAmount: "0",
        paidAmount: "0",
      });
      if (!purchase.success) throw new Error("setup failed");
      purchaseId = purchase.data.id;
      const supplierAfterPurchase = await prisma.supplier.findUniqueOrThrow({ where: { id: supplier.id } });
      expect(supplierAfterPurchase.balance.toString()).toBe("200");

      const ret = await createPurchaseReturn({
        originalInvoiceId: purchaseId,
        cashboxId: cashbox.id,
        settleFromCashbox: false,
        lines: [{ productId: product.id, qtyInSub: "3" }],
      });
      expect(ret.success).toBe(true);
      if (ret.success) returnId = ret.data.id;

      const supplierAfterReturn = await prisma.supplier.findUniqueOrThrow({ where: { id: supplier.id } });
      expect(supplierAfterReturn.balance.toString()).toBe("140");
    } finally {
      if (returnId) await purgeInvoice(returnId);
      if (purchaseId) await purgeInvoice(purchaseId);
      await purgeOrphanedLedgerRows({ supplierIds: [supplier.id] });
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
      await purgeSupplier(supplier.id);
    }
  });
});
