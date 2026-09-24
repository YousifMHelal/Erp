"use server";

import { revalidatePath } from "next/cache";
import {
  AuthRequiredError,
  PermissionDeniedError,
  requirePermission,
} from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/action-result";
import { logError } from "@/lib/logger";
import { nextDocumentNumber } from "@/lib/numbering";
import { prisma } from "@/lib/prisma";
import { syncNotifications } from "@/lib/notifications";
import { decimal } from "@/lib/money";
import { confirmStocktakeSchema, stocktakeIdSchema, updateStocktakeSchema } from "@/lib/validations";
import messages from "@/messages/ar.json";
import type {
  ActionResult,
  StocktakeDetail,
  StocktakeLineDraft,
  StocktakeListRow,
} from "@/types";

const m = messages.stocktakeAction;

class StocktakeDomainError extends Error {
  constructor(public readonly code: keyof typeof m) {
    super(code);
  }
}

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(m.unauthorized);
  if (error instanceof PermissionDeniedError) return fail(m.forbidden);
  if (error instanceof StocktakeDomainError) return fail(m[error.code]);
  logError("Stocktake action failed", error);
  return fail(m.failed);
}

/** The counting sheet's starting state: every active product, counted qty defaulted to system qty. */
export async function getNewStocktakeLines(): Promise<ActionResult<StocktakeLineDraft[]>> {
  try {
    await requirePermission("inventory.stocktake");
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, baseUnitName: true, subUnitName: true, unitsPerBase: true, stockQty: true },
    });
    return ok(
      products.map((product) => ({
        id: product.id,
        productId: product.id,
        productName: product.name,
        unitName: product.subUnitName,
        baseUnitName: product.baseUnitName,
        subUnitName: product.subUnitName,
        unitsPerBase: product.unitsPerBase.toNumber(),
        unitType: "SUB" as const,
        systemQty: product.stockQty.toNumber(),
        countedQty: product.stockQty.toNumber(),
      })),
    );
  } catch (error) {
    return actionError(error);
  }
}

export async function confirmStocktake(
  input: unknown,
): Promise<ActionResult<{ id: string; number: number }>> {
  try {
    const user = await requirePermission("inventory.stocktake");
    const parsed = confirmStocktakeSchema.safeParse(input);
    if (!parsed.success)
      return fail(m.invalid, parsed.error.flatten().fieldErrors);

    const created = await prisma.$transaction(
      async (tx) => {
        const products = await tx.product.findMany({
          where: { id: { in: parsed.data.lines.map((line) => line.productId) } },
        });
        const byId = new Map(products.map((product) => [product.id, product]));

        const number = await nextDocumentNumber(tx, "STOCKTAKE");
        const stocktake = await tx.stocktake.create({
          data: {
            number,
            status: "CONFIRMED",
            note: parsed.data.note,
            createdById: user.id,
            confirmedAt: new Date(),
          },
        });

        for (const line of parsed.data.lines) {
          const product = byId.get(line.productId);
          if (!product) continue;
          const countedQty = decimal(line.countedQty);
          const differenceInSub = countedQty.minus(product.stockQty);

          await tx.stocktakeLine.create({
            data: {
              stocktakeId: stocktake.id,
              productId: product.id,
              systemQtyInSub: product.stockQty,
              countedQtyInSub: countedQty,
              differenceInSub,
            },
          });

          if (differenceInSub.isZero()) continue;

          await tx.product.update({
            where: { id: product.id },
            data: { stockQty: countedQty },
          });
          await tx.stockMovement.create({
            data: {
              productId: product.id,
              type: "STOCKTAKE",
              qtyInSub: differenceInSub,
              balanceAfter: countedQty,
              unitCostPerSub: product.avgCostPerSub,
              refType: "STOCKTAKE",
              refId: stocktake.id,
              createdById: user.id,
            },
          });
        }

        await syncNotifications(tx, { productIds: parsed.data.lines.map((line) => line.productId).filter((id) => byId.has(id)) });

        await writeAudit(tx, {
          userId: user.id,
          action: "stocktake.confirm",
          entityType: "Stocktake",
          entityId: stocktake.id,
          entityLabel: `#${String(number).padStart(4, "0")}`,
          after: { number, lineCount: parsed.data.lines.length },
        });

        return { id: stocktake.id, number };
      },
      { timeout: 30_000 },
    );

    revalidatePath("/inventory/stocktake");
    revalidatePath("/inventory");
    return ok(created);
  } catch (error) {
    return actionError(error);
  }
}

/**
 * Re-edits a confirmed stocktake's counted quantities. Each line's adjustment is applied
 * against the product's CURRENT live stock (not the stocktake's original system qty —
 * other invoices/purchases may have moved stock since), so this is always a correct delta
 * from "where stock is right now" to "what the corrected count says it should be".
 * `systemQtyInSub` on each line is left untouched — it is a historical fact (what the
 * system showed at the moment this stocktake was originally confirmed) and must not drift.
 */
export async function updateStocktake(
  input: unknown,
): Promise<ActionResult<{ id: string; number: number }>> {
  try {
    const user = await requirePermission("inventory.stocktake");
    const parsed = updateStocktakeSchema.safeParse(input);
    if (!parsed.success)
      return fail(m.invalid, parsed.error.flatten().fieldErrors);

    const updated = await prisma.$transaction(
      async (tx) => {
        const stocktake = await tx.stocktake.findUnique({
          where: { id: parsed.data.id },
          include: { lines: true },
        });
        if (!stocktake) throw new StocktakeDomainError("notFound");
        if (stocktake.status !== "CONFIRMED")
          throw new StocktakeDomainError("notFound");

        const lineByProductId = new Map(
          stocktake.lines.map((line) => [line.productId, line]),
        );
        const touchedProductIds: string[] = [];

        for (const input of parsed.data.lines) {
          const existingLine = lineByProductId.get(input.productId);
          if (!existingLine) continue;

          const newCountedQty = decimal(input.countedQty);
          if (newCountedQty.eq(existingLine.countedQtyInSub)) continue;

          const product = await tx.product.findUniqueOrThrow({
            where: { id: input.productId },
          });
          const adjustment = newCountedQty.minus(product.stockQty);
          const newStock = product.stockQty.plus(adjustment);
          if (newStock.lt(0)) throw new StocktakeDomainError("negativeStock");

          await tx.product.update({
            where: { id: input.productId },
            data: { stockQty: newStock },
          });
          await tx.stockMovement.create({
            data: {
              productId: input.productId,
              type: "STOCKTAKE",
              qtyInSub: adjustment,
              balanceAfter: newStock,
              unitCostPerSub: product.avgCostPerSub,
              refType: "STOCKTAKE",
              refId: stocktake.id,
              createdById: user.id,
              note: "تعديل جرد",
            },
          });
          await tx.stocktakeLine.update({
            where: { id: existingLine.id },
            data: {
              countedQtyInSub: newCountedQty,
              differenceInSub: newCountedQty.minus(existingLine.systemQtyInSub),
            },
          });
          touchedProductIds.push(input.productId);
        }

        if (parsed.data.note !== undefined) {
          await tx.stocktake.update({
            where: { id: stocktake.id },
            data: { note: parsed.data.note },
          });
        }

        if (touchedProductIds.length > 0) {
          await syncNotifications(tx, { productIds: touchedProductIds });
        }

        await writeAudit(tx, {
          userId: user.id,
          action: "stocktake.update",
          entityType: "Stocktake",
          entityId: stocktake.id,
          entityLabel: `#${String(stocktake.number).padStart(4, "0")}`,
          before: { lineCount: stocktake.lines.length },
          after: { touchedLines: touchedProductIds.length },
        });

        return { id: stocktake.id, number: stocktake.number };
      },
      { timeout: 30_000 },
    );

    revalidatePath("/inventory/stocktake");
    revalidatePath(`/inventory/stocktake/${updated.id}`);
    revalidatePath("/inventory");
    return ok(updated);
  } catch (error) {
    return actionError(error);
  }
}

/**
 * Hard-deletes a confirmed stocktake. Every line's recorded difference is reversed against
 * the product's current live stock first (writing a compensating StockMovement so the
 * ledger stays reconciled), then the Stocktake row is deleted — cascading its lines. No
 * status is left behind; the record is gone, matching the invoice hard-delete pattern.
 */
export async function deleteStocktake(
  id: string,
): Promise<ActionResult<{ number: number }>> {
  try {
    const user = await requirePermission("inventory.stocktake");
    const parsedId = stocktakeIdSchema.safeParse(id);
    if (!parsedId.success) return fail(m.invalid);

    const deleted = await prisma.$transaction(
      async (tx) => {
        const stocktake = await tx.stocktake.findUnique({
          where: { id: parsedId.data },
          include: { lines: true },
        });
        if (!stocktake) throw new StocktakeDomainError("notFound");
        if (stocktake.status !== "CONFIRMED")
          throw new StocktakeDomainError("notFound");

        for (const line of stocktake.lines) {
          if (line.differenceInSub.isZero()) continue;

          const product = await tx.product.findUniqueOrThrow({
            where: { id: line.productId },
          });
          const restoredStock = product.stockQty.minus(line.differenceInSub);
          if (restoredStock.lt(0)) throw new StocktakeDomainError("negativeStock");

          await tx.product.update({
            where: { id: line.productId },
            data: { stockQty: restoredStock },
          });
          await tx.stockMovement.create({
            data: {
              productId: line.productId,
              type: "STOCKTAKE",
              qtyInSub: line.differenceInSub.negated(),
              balanceAfter: restoredStock,
              unitCostPerSub: product.avgCostPerSub,
              refType: "STOCKTAKE",
              refId: stocktake.id,
              createdById: user.id,
              note: "حذف جرد",
            },
          });
        }

        await syncNotifications(tx, {
          productIds: stocktake.lines.map((line) => line.productId),
        });

        await writeAudit(tx, {
          userId: user.id,
          action: "stocktake.delete",
          entityType: "Stocktake",
          entityId: stocktake.id,
          entityLabel: `#${String(stocktake.number).padStart(4, "0")}`,
          before: { status: stocktake.status, lineCount: stocktake.lines.length },
          after: undefined,
        });

        await tx.stocktake.delete({ where: { id: stocktake.id } });

        return { number: stocktake.number };
      },
      { timeout: 30_000 },
    );

    revalidatePath("/inventory/stocktake");
    revalidatePath("/inventory");
    return ok(deleted);
  } catch (error) {
    return actionError(error);
  }
}

export async function getStocktakes(): Promise<ActionResult<StocktakeListRow[]>> {
  try {
    await requirePermission("inventory.view");
    const stocktakes = await prisma.stocktake.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { displayName: true } },
        lines: true,
      },
    });
    return ok(
      stocktakes.map((stocktake) => ({
        id: stocktake.id,
        number: stocktake.number,
        status: stocktake.status,
        lineCount: stocktake.lines.length,
        totalDifference: stocktake.lines.reduce(
          (sum, line) => sum + line.differenceInSub.toNumber(),
          0,
        ),
        createdByName: stocktake.createdBy.displayName,
        createdAt: stocktake.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    return actionError(error);
  }
}

export async function getStocktakeById(
  id: string,
): Promise<ActionResult<StocktakeDetail>> {
  try {
    await requirePermission("inventory.view");
    const parsedId = stocktakeIdSchema.safeParse(id);
    if (!parsedId.success) return fail(m.invalid);
    const stocktake = await prisma.stocktake.findUnique({
      where: { id: parsedId.data },
      include: {
        createdBy: { select: { displayName: true } },
        lines: { include: { product: { select: { name: true, baseUnitName: true, subUnitName: true, unitsPerBase: true } } } },
      },
    });
    if (!stocktake) return fail(m.notFound);
    return ok({
      id: stocktake.id,
      number: stocktake.number,
      status: stocktake.status,
      lineCount: stocktake.lines.length,
      totalDifference: stocktake.lines.reduce(
        (sum, line) => sum + line.differenceInSub.toNumber(),
        0,
      ),
      createdByName: stocktake.createdBy.displayName,
      createdAt: stocktake.createdAt.toISOString(),
      note: stocktake.note ?? undefined,
      lines: stocktake.lines.map((line) => ({
        id: line.id,
        productId: line.productId,
        productName: line.product.name,
        unitName: line.product.subUnitName,
        baseUnitName: line.product.baseUnitName,
        subUnitName: line.product.subUnitName,
        unitsPerBase: line.product.unitsPerBase.toNumber(),
        systemQty: line.systemQtyInSub.toNumber(),
        countedQty: line.countedQtyInSub.toNumber(),
        difference: line.differenceInSub.toNumber(),
      })),
    });
  } catch (error) {
    return actionError(error);
  }
}
