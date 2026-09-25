import { getCurrentUser } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { OfflineSnapshot } from "@/types";

/**
 * Everything the device needs to create sales, purchases, collections and payments while offline,
 * for the signed-in user (null when signed out). Prices mirror searchSaleProducts /
 * searchPurchaseProducts exactly; all Decimals are strings.
 */
export async function buildOfflineSnapshot(): Promise<OfflineSnapshot | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const can = (key: string) => hasPermission(user.role.permissions, key);

  const [products, customers, suppliers, cashboxes] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, balance: true } }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, balance: true } }),
    prisma.cashbox.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true, balance: true } }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    userId: user.id,
    permissions: {
      sale: can("sale.create"),
      purchase: can("purchase.create"),
      collection: can("collection.create"),
      payment: can("payment.create"),
    },
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      baseUnitName: product.baseUnitName,
      subUnitName: product.subUnitName,
      unitsPerBase: product.unitsPerBase.toString(),
      stockQty: product.stockQty.toString(),
      salePricePerBase: product.sellPricePerBase.toString(),
      salePricePerSub: product.sellPricePerBase.div(product.unitsPerBase).toDecimalPlaces(4).toString(),
      purchasePricePerBase: product.purchasePricePerBase.toString(),
      purchasePricePerSub: product.purchasePricePerBase.div(product.unitsPerBase).toDecimalPlaces(4).toString(),
    })),
    customers: customers.map((c) => ({ id: c.id, name: c.name, balance: c.balance.toString() })),
    suppliers: suppliers.map((s) => ({ id: s.id, name: s.name, balance: s.balance.toString() })),
    cashboxes: cashboxes.map((c) => ({ id: c.id, name: c.name, balance: c.balance.toString() })),
  };
}
