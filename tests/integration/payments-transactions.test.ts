import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createPayment, deletePayment, updatePayment } from "@/actions/payments.actions";
import {
  asUser,
  createScratchCashbox,
  createScratchSupplier,
  purgeCashbox,
  purgeSupplier,
} from "./helpers";

async function purgePayment(paymentId: string) {
  await prisma.$transaction([
    prisma.cashMovement.deleteMany({ where: { refType: "PAYMENT", refId: paymentId } }),
    prisma.partyTransaction.deleteMany({ where: { refType: "PAYMENT", refId: paymentId } }),
    prisma.auditLog.deleteMany({ where: { entityId: paymentId, entityType: "Payment" } }),
    prisma.payment.deleteMany({ where: { id: paymentId } }),
  ]);
}

describe("payment transactions", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creating a payment: cashbox decreases, supplier balance decreases by the same amount", async () => {
    await asUser("admin");
    const cashbox = await createScratchCashbox({ balance: 200 });
    const supplier = await createScratchSupplier({ balance: 100 });
    let paymentId: string | undefined;
    try {
      const result = await createPayment({ supplierId: supplier.id, cashboxId: cashbox.id, amount: "60" });
      expect(result.success).toBe(true);
      if (!result.success) return;
      paymentId = result.data.id;

      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      const supplierAfter = await prisma.supplier.findUniqueOrThrow({ where: { id: supplier.id } });
      expect(cashboxAfter.balance.toString()).toBe("140");
      expect(supplierAfter.balance.toString()).toBe("40");
    } finally {
      if (paymentId) await purgePayment(paymentId);
      await purgeCashbox(cashbox.id);
      await purgeSupplier(supplier.id);
    }
  });

  it("rejects paying more than the supplier's outstanding balance", async () => {
    await asUser("admin");
    const cashbox = await createScratchCashbox({ balance: 200 });
    const supplier = await createScratchSupplier({ balance: 30 });
    try {
      const result = await createPayment({ supplierId: supplier.id, cashboxId: cashbox.id, amount: "50" });
      expect(result.success).toBe(false);
    } finally {
      await purgeCashbox(cashbox.id);
      await purgeSupplier(supplier.id);
    }
  });

  it("rejects a payment exceeding the cashbox's available balance", async () => {
    await asUser("admin");
    const cashbox = await createScratchCashbox({ balance: 10 });
    const supplier = await createScratchSupplier({ balance: 500 });
    try {
      const result = await createPayment({ supplierId: supplier.id, cashboxId: cashbox.id, amount: "50" });
      expect(result.success).toBe(false);

      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      expect(cashboxAfter.balance.toString()).toBe("10");
    } finally {
      await purgeCashbox(cashbox.id);
      await purgeSupplier(supplier.id);
    }
  });

  it("deleting (cancelling) a payment reverses cash and supplier balance exactly", async () => {
    await asUser("admin");
    const cashbox = await createScratchCashbox({ balance: 200 });
    const supplier = await createScratchSupplier({ balance: 100 });
    let paymentId: string | undefined;
    try {
      const created = await createPayment({ supplierId: supplier.id, cashboxId: cashbox.id, amount: "60" });
      if (!created.success) throw new Error("setup failed");
      paymentId = created.data.id;

      const deleted = await deletePayment(paymentId);
      expect(deleted.success).toBe(true);

      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      const supplierAfter = await prisma.supplier.findUniqueOrThrow({ where: { id: supplier.id } });
      expect(cashboxAfter.balance.toString()).toBe("200");
      expect(supplierAfter.balance.toString()).toBe("100");

      const row = await prisma.payment.findUnique({ where: { id: paymentId } });
      expect(row).toBeNull();
      paymentId = undefined;
    } finally {
      if (paymentId) await purgePayment(paymentId);
      await purgeCashbox(cashbox.id);
      await purgeSupplier(supplier.id);
    }
  });

  it("editing a payment's amount reverses the old effect and reapplies the new one", async () => {
    await asUser("admin");
    const cashbox = await createScratchCashbox({ balance: 200 });
    const supplier = await createScratchSupplier({ balance: 100 });
    let paymentId: string | undefined;
    try {
      const created = await createPayment({ supplierId: supplier.id, cashboxId: cashbox.id, amount: "40" });
      if (!created.success) throw new Error("setup failed");
      paymentId = created.data.id;

      const edited = await updatePayment({
        id: paymentId,
        supplierId: supplier.id,
        cashboxId: cashbox.id,
        amount: "70",
      });
      expect(edited.success).toBe(true);

      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      const supplierAfter = await prisma.supplier.findUniqueOrThrow({ where: { id: supplier.id } });
      expect(cashboxAfter.balance.toString()).toBe("130");
      expect(supplierAfter.balance.toString()).toBe("30");
    } finally {
      if (paymentId) await purgePayment(paymentId);
      await purgeCashbox(cashbox.id);
      await purgeSupplier(supplier.id);
    }
  });

  it("rejects a permission-denied payment.create for a role without it (cashier)", async () => {
    await asUser("cashier1");
    const cashbox = await createScratchCashbox({ balance: 200 });
    const supplier = await createScratchSupplier({ balance: 100 });
    try {
      const result = await createPayment({ supplierId: supplier.id, cashboxId: cashbox.id, amount: "10" });
      expect(result.success).toBe(false); // cashier has no payment.* permissions per seed
    } finally {
      await purgeCashbox(cashbox.id);
      await purgeSupplier(supplier.id);
    }
  });
});
