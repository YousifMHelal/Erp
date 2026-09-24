"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthRequiredError,
  PermissionDeniedError,
  requirePermission,
} from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/action-result";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { productIdSchema, productSchema } from "@/lib/validations";
import messages from "@/messages/ar.json";
import type {
  ActionResult,
  EntityComboboxOption,
  InventoryProductRow,
  PriceHistoryEntry,
  ProductDetail,
  StockMovementRow,
} from "@/types";

const m = messages.inventoryAction;

class InventoryDomainError extends Error {
  constructor(public readonly code: keyof typeof m) {
    super(code);
  }
}

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(m.unauthorized);
  if (error instanceof PermissionDeniedError) return fail(m.forbidden);
  if (error instanceof InventoryDomainError) return fail(m[error.code]);
  logError("Inventory action failed", error);
  return fail(m.failed);
}

function toRow(product: Prisma.ProductGetPayload<{ include: { category: true } }>): InventoryProductRow {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode ?? undefined,
    categoryName: product.category?.name ?? "",
    stockQty: product.stockQty.toNumber(),
    baseUnitName: product.baseUnitName,
    subUnitName: product.subUnitName,
    unitsPerBase: product.unitsPerBase.toNumber(),
    purchasePricePerBase: product.purchasePricePerBase.toString(),
    sellPricePerBase: product.sellPricePerBase.toString(),
    avgCostPerSub: product.avgCostPerSub.toString(),
    minStockQty: product.minStockQty.toNumber(),
    isActive: product.isActive,
  };
}

export async function getProducts(): Promise<ActionResult<InventoryProductRow[]>> {
  try {
    await requirePermission("inventory.view");
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    });
    return ok(products.map(toRow));
  } catch (error) {
    return actionError(error);
  }
}

export async function getCategoryOptions(): Promise<ActionResult<EntityComboboxOption[]>> {
  try {
    await requirePermission("inventory.view");
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return ok(categories.map((c) => ({ value: c.id, label: c.name })));
  } catch (error) {
    return actionError(error);
  }
}

export async function createProduct(
  input: unknown,
): Promise<ActionResult<InventoryProductRow>> {
  try {
    const user = await requirePermission("inventory.create");
    const parsed = productSchema.safeParse(input);
    if (!parsed.success)
      return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const data = parsed.data;

    const [skuTaken, barcodeTaken] = await Promise.all([
      prisma.product.findUnique({ where: { sku: data.sku } }),
      data.barcode
        ? prisma.product.findUnique({ where: { barcode: data.barcode } })
        : null,
    ]);
    if (skuTaken) throw new InventoryDomainError("skuTaken");
    if (barcodeTaken) throw new InventoryDomainError("barcodeTaken");

    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku: data.sku,
          barcode: data.barcode || undefined,
          name: data.name,
          categoryId: data.categoryId || undefined,
          baseUnitName: data.baseUnitName,
          subUnitName: data.subUnitName,
          unitsPerBase: data.unitsPerBase,
          purchasePricePerBase: data.purchasePricePerBase,
          sellPricePerBase: data.sellPricePerBase,
          avgCostPerSub: new Prisma.Decimal(data.purchasePricePerBase).div(data.unitsPerBase),
          stockQty: 0,
          minStockQty: data.minStockQty,
          notes: data.notes,
          isActive: data.isActive,
        },
        include: { category: true },
      });
      await writeAudit(tx, {
        userId: user.id,
        action: "product.create",
        entityType: "Product",
        entityId: product.id,
        entityLabel: product.name,
        after: { sku: product.sku, name: product.name, sellPricePerBase: product.sellPricePerBase },
      });
      return product;
    });
    revalidatePath("/inventory");
    return ok(toRow(created));
  } catch (error) {
    return actionError(error);
  }
}

export async function updateProduct(
  id: string,
  input: unknown,
): Promise<ActionResult<InventoryProductRow>> {
  try {
    const user = await requirePermission("inventory.edit");
    const parsedId = productIdSchema.safeParse(id);
    if (!parsedId.success) return fail(m.invalid);
    const parsed = productSchema.safeParse(input);
    if (!parsed.success)
      return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const data = parsed.data;

    const existing = await prisma.product.findUnique({ where: { id: parsedId.data } });
    if (!existing) throw new InventoryDomainError("notFound");

    const [skuTaken, barcodeTaken] = await Promise.all([
      prisma.product.findFirst({ where: { sku: data.sku, id: { not: existing.id } } }),
      data.barcode
        ? prisma.product.findFirst({ where: { barcode: data.barcode, id: { not: existing.id } } })
        : null,
    ]);
    if (skuTaken) throw new InventoryDomainError("skuTaken");
    if (barcodeTaken) throw new InventoryDomainError("barcodeTaken");

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: existing.id },
        data: {
          sku: data.sku,
          barcode: data.barcode || null,
          name: data.name,
          categoryId: data.categoryId || null,
          baseUnitName: data.baseUnitName,
          subUnitName: data.subUnitName,
          unitsPerBase: data.unitsPerBase,
          purchasePricePerBase: data.purchasePricePerBase,
          sellPricePerBase: data.sellPricePerBase,
          minStockQty: data.minStockQty,
          notes: data.notes,
          isActive: data.isActive,
        },
        include: { category: true },
      });
      await writeAudit(tx, {
        userId: user.id,
        action: "product.edit",
        entityType: "Product",
        entityId: product.id,
        entityLabel: product.name,
        before: {
          sku: existing.sku,
          name: existing.name,
          purchasePricePerBase: existing.purchasePricePerBase.toString(),
          sellPricePerBase: existing.sellPricePerBase.toString(),
          minStockQty: existing.minStockQty.toString(),
        },
        after: {
          sku: product.sku,
          name: product.name,
          purchasePricePerBase: product.purchasePricePerBase.toString(),
          sellPricePerBase: product.sellPricePerBase.toString(),
          minStockQty: product.minStockQty.toString(),
        },
      });
      return product;
    });
    revalidatePath("/inventory");
    revalidatePath(`/inventory/${existing.id}`);
    return ok(toRow(updated));
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteProduct(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("inventory.edit");
    const parsedId = productIdSchema.safeParse(id);
    if (!parsedId.success) return fail(m.invalid);

    const [product, movementCount] = await Promise.all([
      prisma.product.findUnique({ where: { id: parsedId.data } }),
      prisma.stockMovement.count({ where: { productId: parsedId.data } }),
    ]);
    if (!product) throw new InventoryDomainError("notFound");
    if (product.stockQty.gt(0)) throw new InventoryDomainError("hasStock");
    if (movementCount > 0) throw new InventoryDomainError("hasMovements");

    await prisma.$transaction(async (tx) => {
      await tx.product.delete({ where: { id: product.id } });
      await writeAudit(tx, {
        userId: user.id,
        action: "product.delete",
        entityType: "Product",
        entityId: product.id,
        entityLabel: product.name,
        before: { sku: product.sku, name: product.name },
      });
    });
    revalidatePath("/inventory");
    return ok({ id: product.id });
  } catch (error) {
    return actionError(error);
  }
}

const MOVEMENT_INVOICE_LABEL: Record<string, string> = {
  PURCHASE: messages.nav.purchases,
  SALE: messages.nav.sales,
  SALE_RETURN: messages.nav.salesReturns,
  PURCHASE_RETURN: messages.nav.purchaseReturns,
};

export async function getProductDetail(
  id: string,
): Promise<ActionResult<{ product: ProductDetail; movements: StockMovementRow[]; priceHistory: PriceHistoryEntry[] }>> {
  try {
    await requirePermission("inventory.view");
    const parsedId = productIdSchema.safeParse(id);
    if (!parsedId.success) return fail(m.invalid);

    const [product, movements, auditRows] = await Promise.all([
      prisma.product.findUnique({ where: { id: parsedId.data }, include: { category: true } }),
      prisma.stockMovement.findMany({
        where: { productId: parsedId.data },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { invoice: { select: { number: true, type: true } } },
      }),
      prisma.auditLog.findMany({
        where: { entityType: "Product", entityId: parsedId.data, action: "product.edit" },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { user: { select: { displayName: true } } },
      }),
    ]);
    if (!product) return fail(m.notFound);

    const priceHistory: PriceHistoryEntry[] = auditRows.flatMap((row) => {
      const before = (row.beforeJson ?? {}) as Record<string, unknown>;
      const after = (row.afterJson ?? {}) as Record<string, unknown>;
      const fields: { key: string; labelKey: keyof typeof messages.inventory.priceHistoryFields }[] = [
        { key: "sellPricePerBase", labelKey: "sellPrice" },
        { key: "purchasePricePerBase", labelKey: "purchasePrice" },
      ];
      return fields
        .filter((field) => field.key in before || field.key in after)
        .map((field) => ({
          id: `${row.id}-${field.key}`,
          changedAt: row.createdAt.toISOString(),
          fieldLabel: messages.inventory.priceHistoryFields[field.labelKey],
          oldValue: String(before[field.key] ?? ""),
          newValue: String(after[field.key] ?? ""),
          changedByName: row.user.displayName,
        }));
    });

    return ok({
      product: {
        ...toRow(product),
        notes: product.notes ?? undefined,
        createdAt: product.createdAt.toISOString(),
      },
      movements: movements.map((movement) => ({
        id: movement.id,
        type: movement.type,
        qtyInSub: movement.qtyInSub.toNumber(),
        balanceAfter: movement.balanceAfter.toNumber(),
        refLabel: movement.invoice
          ? `${MOVEMENT_INVOICE_LABEL[movement.type] ?? ""} #${String(movement.invoice.number).padStart(6, "0")}`
          : movement.note ?? movement.refType,
        createdAt: movement.createdAt.toISOString(),
      })),
      priceHistory,
    });
  } catch (error) {
    return actionError(error);
  }
}
