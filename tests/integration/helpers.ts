import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mockAuth } from "../setup";

export async function asUser(username: "admin" | "accountant" | "cashier1" | "cashier2") {
  const user = await prisma.user.findUniqueOrThrow({ where: { username } });
  mockAuth.mockResolvedValue({ user: { id: user.id } });
  return user;
}

let counter = 0;
function unique(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export async function createScratchProduct(overrides: Partial<Prisma.ProductCreateInput> = {}) {
  return prisma.product.create({
    data: {
      sku: unique("TST-SKU"),
      name: `Test Product ${unique("")}`,
      baseUnitName: "كرتونة",
      subUnitName: "قطعة",
      unitsPerBase: 10,
      purchasePricePerBase: 100,
      sellPricePerBase: 150,
      avgCostPerSub: 10,
      stockQty: 100,
      minStockQty: 5,
      isActive: true,
      ...overrides,
    },
  });
}

export async function createScratchCustomer(overrides: Partial<Prisma.CustomerCreateInput> = {}) {
  return prisma.customer.create({
    data: {
      name: `Test Customer ${unique("")}`,
      openingBalance: 0,
      balance: 0,
      isActive: true,
      ...overrides,
    },
  });
}

export async function createScratchSupplier(overrides: Partial<Prisma.SupplierCreateInput> = {}) {
  return prisma.supplier.create({
    data: {
      name: `Test Supplier ${unique("")}`,
      openingBalance: 0,
      balance: 0,
      isActive: true,
      ...overrides,
    },
  });
}

export async function createScratchCashbox(overrides: Partial<Prisma.CashboxCreateInput> = {}) {
  return prisma.cashbox.create({
    data: {
      name: `Test Cashbox ${unique("")}`,
      openingBalance: 0,
      balance: 0,
      isActive: true,
      sortOrder: 999,
      ...overrides,
    },
  });
}

/**
 * Hard-deletes a document's rows in the right FK order. Test-only cleanup, not app
 * behavior. Runs as one transaction so Neon's pooled connections can't interleave
 * a later purge (e.g. purgeProduct) against a not-yet-visible earlier delete.
 */
export async function purgeInvoice(invoiceId: string) {
  await prisma.$transaction([
    prisma.stockMovement.deleteMany({ where: { invoiceId } }),
    prisma.cashMovement.deleteMany({ where: { invoiceId } }),
    prisma.partyTransaction.deleteMany({ where: { invoiceId } }),
    prisma.auditLog.deleteMany({ where: { entityId: invoiceId, entityType: "Invoice" } }),
    prisma.invoiceLine.deleteMany({ where: { invoiceId } }),
    prisma.invoice.deleteMany({ where: { id: invoiceId } }),
  ]);
}

/** Cleans up ledger rows left dangling (invoiceId set to null via onDelete: SetNull) after a document's invoice row was hard-deleted by the app itself (e.g. cancelSale). */
export async function purgeOrphanedLedgerRows(input: {
  productIds?: string[];
  cashboxIds?: string[];
  customerIds?: string[];
  supplierIds?: string[];
}) {
  await prisma.$transaction([
    ...(input.productIds?.length
      ? [prisma.stockMovement.deleteMany({ where: { productId: { in: input.productIds } } })]
      : []),
    ...(input.cashboxIds?.length
      ? [prisma.cashMovement.deleteMany({ where: { cashboxId: { in: input.cashboxIds } } })]
      : []),
    ...(input.customerIds?.length
      ? [prisma.partyTransaction.deleteMany({ where: { customerId: { in: input.customerIds } } })]
      : []),
    ...(input.supplierIds?.length
      ? [prisma.partyTransaction.deleteMany({ where: { supplierId: { in: input.supplierIds } } })]
      : []),
  ]);
}

export async function purgeProduct(productId: string) {
  await prisma.$transaction([
    prisma.stockMovement.deleteMany({ where: { productId } }),
    prisma.product.deleteMany({ where: { id: productId } }),
  ]);
}

export async function purgeCustomer(customerId: string) {
  await prisma.$transaction([
    prisma.cashMovement.deleteMany({ where: { customerId } }),
    prisma.partyTransaction.deleteMany({ where: { customerId } }),
    prisma.customer.deleteMany({ where: { id: customerId } }),
  ]);
}

export async function purgeSupplier(supplierId: string) {
  await prisma.$transaction([
    prisma.cashMovement.deleteMany({ where: { supplierId } }),
    prisma.partyTransaction.deleteMany({ where: { supplierId } }),
    prisma.supplier.deleteMany({ where: { id: supplierId } }),
  ]);
}

export async function purgeCashbox(cashboxId: string) {
  await prisma.$transaction([
    prisma.cashMovement.deleteMany({ where: { cashboxId } }),
    prisma.cashbox.deleteMany({ where: { id: cashboxId } }),
  ]);
}
