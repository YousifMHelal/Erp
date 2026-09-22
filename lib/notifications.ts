import type { Prisma } from "@prisma/client";
import type { NotificationTargets } from "@/types";

async function syncProduct(tx: Prisma.TransactionClient, productId: string) {
  const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
  const dedupeKey = `stock:${product.id}`;
  if (product.stockQty.gt(product.minStockQty)) {
    await tx.notification.deleteMany({ where: { dedupeKey } });
    return;
  }
  const outOfStock = product.stockQty.lte(0);
  await tx.notification.upsert({
    where: { dedupeKey },
    create: {
      dedupeKey,
      type: outOfStock ? "OUT_OF_STOCK" : "LOW_STOCK",
      severity: outOfStock ? "CRITICAL" : "WARNING",
      titleKey: outOfStock ? "outOfStock" : "lowStock",
      bodyParams: { name: product.name, stock: product.stockQty.toString(), min: product.minStockQty.toString(), unit: product.subUnitName },
      entityType: "Product", entityId: product.id,
    },
    update: {
      type: outOfStock ? "OUT_OF_STOCK" : "LOW_STOCK",
      severity: outOfStock ? "CRITICAL" : "WARNING",
      titleKey: outOfStock ? "outOfStock" : "lowStock",
      bodyParams: { name: product.name, stock: product.stockQty.toString(), min: product.minStockQty.toString(), unit: product.subUnitName },
      isRead: false, readAt: null,
    },
  });
}

async function syncCustomer(tx: Prisma.TransactionClient, customerId: string) {
  const customer = await tx.customer.findUniqueOrThrow({ where: { id: customerId } });
  const dedupeKey = `customer-balance:${customer.id}`;
  if (customer.balance.lte(0)) return void await tx.notification.deleteMany({ where: { dedupeKey } });
  await tx.notification.upsert({
    where: { dedupeKey },
    create: { dedupeKey, type: "CUSTOMER_BALANCE", severity: "INFO", titleKey: "customerBalance", bodyParams: { name: customer.name, balance: customer.balance.toString() }, entityType: "Customer", entityId: customer.id },
    update: { bodyParams: { name: customer.name, balance: customer.balance.toString() }, isRead: false, readAt: null },
  });
}

async function syncSupplier(tx: Prisma.TransactionClient, supplierId: string) {
  const supplier = await tx.supplier.findUniqueOrThrow({ where: { id: supplierId } });
  const dedupeKey = `supplier-balance:${supplier.id}`;
  if (supplier.balance.lte(0)) return void await tx.notification.deleteMany({ where: { dedupeKey } });
  await tx.notification.upsert({
    where: { dedupeKey },
    create: { dedupeKey, type: "SUPPLIER_BALANCE", severity: "INFO", titleKey: "supplierBalance", bodyParams: { name: supplier.name, balance: supplier.balance.toString() }, entityType: "Supplier", entityId: supplier.id },
    update: { bodyParams: { name: supplier.name, balance: supplier.balance.toString() }, isRead: false, readAt: null },
  });
}

export async function syncNotifications(tx: Prisma.TransactionClient, targets: NotificationTargets) {
  await Promise.all([
    ...Array.from(new Set(targets.productIds ?? [])).map((id) => syncProduct(tx, id)),
    ...Array.from(new Set(targets.customerIds ?? [])).map((id) => syncCustomer(tx, id)),
    ...Array.from(new Set(targets.supplierIds ?? [])).map((id) => syncSupplier(tx, id)),
  ]);
}
