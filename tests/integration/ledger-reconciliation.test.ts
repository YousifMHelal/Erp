import { afterAll, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cancelSale, createSale } from "@/actions/sales.actions";
import { cancelPurchase, createPurchase } from "@/actions/purchases.actions";
import { createCollection, deleteCollection } from "@/actions/collections.actions";
import { createPayment } from "@/actions/payments.actions";
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

const zero = new Prisma.Decimal(0);

async function assertCashboxReconciles(cashboxId: string) {
  const cashbox = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashboxId } });
  const ledger = await prisma.cashMovement.aggregate({
    where: { cashboxId }, _sum: { amount: true },
  });
  const expected = cashbox.openingBalance.plus(ledger._sum.amount ?? zero);
  expect(expected.toString()).toBe(cashbox.balance.toString());
}

async function assertCustomerReconciles(customerId: string) {
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
  const ledger = await prisma.partyTransaction.aggregate({
    where: { customerId }, _sum: { debit: true, credit: true },
  });
  const expected = (ledger._sum.debit ?? zero).minus(ledger._sum.credit ?? zero);
  expect(expected.toString()).toBe(customer.balance.toString());
}

async function assertSupplierReconciles(supplierId: string) {
  const supplier = await prisma.supplier.findUniqueOrThrow({ where: { id: supplierId } });
  const ledger = await prisma.partyTransaction.aggregate({
    where: { supplierId }, _sum: { debit: true, credit: true },
  });
  const expected = (ledger._sum.debit ?? zero).minus(ledger._sum.credit ?? zero);
  expect(expected.toString()).toBe(supplier.balance.toString());
}

/** Mulberry32 — small deterministic PRNG so a failing run is reproducible from the printed seed. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("ledger reconciliation holds after a randomized operation sequence", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("balance == opening + Σ(ledger) for cashbox, customer, and supplier after a randomized operation sequence", { timeout: 300_000 }, async () => {
    const seed = Date.now() & 0xffffffff;
    const rand = mulberry32(seed);
    console.log(`ledger-reconciliation seed: ${seed}`);

    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 1000 });
    const cashbox = await createScratchCashbox({ balance: 0 });
    const customer = await createScratchCustomer({ balance: 0 });
    const supplier = await createScratchSupplier({ balance: 0 });

    const openInvoiceIds: string[] = [];
    const openCollectionIds: string[] = [];

    try {
      const OPS = 16;
      for (let i = 0; i < OPS; i++) {
        const roll = rand();
        const qty = 1 + Math.floor(rand() * 5);
        const price = 10 + Math.floor(rand() * 20);
        const total = qty * price;

        if (roll < 0.25) {
          // Credit sale (always leaves a remainder so the customer ledger gets exercised).
          const paid = Math.floor(total * rand() * 0.5);
          const result = await createSale({
            customerId: customer.id,
            cashboxId: cashbox.id,
            lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: String(qty), unitPrice: String(price) }],
            discountAmount: "0",
            paidAmount: String(paid),
          });
          if (result.success) openInvoiceIds.push(result.data.id);
        } else if (roll < 0.5) {
          // Credit purchase.
          const paid = Math.floor(total * rand() * 0.5);
          const result = await createPurchase({
            supplierId: supplier.id,
            cashboxId: cashbox.id,
            lines: [{ productId: product.id, unitType: "SUB", qtyInUnit: String(qty), unitPrice: String(price) }],
            discountAmount: "0",
            paidAmount: String(paid),
          });
          if (result.success) openInvoiceIds.push(result.data.id);
        } else if (roll < 0.65 && openInvoiceIds.length > 0) {
          // Cancel a random open invoice (sale or purchase).
          const idx = Math.floor(rand() * openInvoiceIds.length);
          const id = openInvoiceIds[idx];
          if (id) {
            const cancelledAsSale = await cancelSale({ id, reason: "اختبار عشوائي" });
            if (!cancelledAsSale.success) await cancelPurchase({ id, reason: "اختبار عشوائي" });
            openInvoiceIds.splice(idx, 1);
          }
        } else if (roll < 0.85) {
          // Collection against the customer, capped at its current balance so it can succeed.
          const current = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
          if (current.balance.gt(0)) {
            const amount = Math.max(1, Math.floor(current.balance.toNumber() * rand()));
            const result = await createCollection({ customerId: customer.id, cashboxId: cashbox.id, amount: String(amount) });
            if (result.success) openCollectionIds.push(result.data.id);
          }
        } else {
          // Payment to the supplier, capped at both supplier balance and cashbox balance.
          const [currentSupplier, currentCashbox] = await Promise.all([
            prisma.supplier.findUniqueOrThrow({ where: { id: supplier.id } }),
            prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } }),
          ]);
          const cap = Prisma.Decimal.min(currentSupplier.balance, currentCashbox.balance);
          if (cap.gt(0)) {
            const amount = Math.max(1, Math.floor(cap.toNumber() * rand()));
            await createPayment({ supplierId: supplier.id, cashboxId: cashbox.id, amount: String(amount) });
          }
        }
      }

      // Cancel a random subset of collections too, to exercise that reversal path.
      for (const id of openCollectionIds) {
        if (rand() < 0.3) await deleteCollection(id);
      }

      await assertCashboxReconciles(cashbox.id);
      await assertCustomerReconciles(customer.id);
      await assertSupplierReconciles(supplier.id);

      // Product stock must also never have gone negative at any point — the hard block
      // in stockAfterMovement/moveStock would have surfaced as a failed action, not a
      // corrupted balance, so this just confirms the final state is sane.
      const productAfter = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(productAfter.stockQty.gte(0)).toBe(true);
    } finally {
      for (const id of openInvoiceIds) {
        const stillExists = await prisma.invoice.findUnique({ where: { id } });
        if (stillExists) await purgeInvoice(id);
      }
      await prisma.$transaction([
        prisma.collection.deleteMany({ where: { customerId: customer.id } }),
        prisma.payment.deleteMany({ where: { supplierId: supplier.id } }),
      ]);
      await purgeOrphanedLedgerRows({
        productIds: [product.id],
        cashboxIds: [cashbox.id],
        customerIds: [customer.id],
        supplierIds: [supplier.id],
      });
      await purgeProduct(product.id);
      await purgeCashbox(cashbox.id);
      await purgeCustomer(customer.id);
      await purgeSupplier(supplier.id);
    }
  });
});
