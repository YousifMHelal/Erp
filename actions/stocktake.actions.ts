"use server";

import { revalidatePath } from "next/cache";
import {
  AuthRequiredError,
  PermissionDeniedError,
  requirePermission,
} from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/action-result";
import { nextDocumentNumber } from "@/lib/numbering";
import { prisma } from "@/lib/prisma";
import { decimal } from "@/lib/money";
import { confirmStocktakeSchema, stocktakeIdSchema } from "@/lib/validations";
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
  console.error("Stocktake action failed", error);
  return fail(m.failed);
}

/** The counting sheet's starting state: every active product, counted qty defaulted to system qty. */
export async function getNewStocktakeLines(): Promise<ActionResult<StocktakeLineDraft[]>> {
  try {
    await requirePermission("inventory.stocktake");
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, subUnitName: true, stockQty: true },
    });
    return ok(
      products.map((product) => ({
        id: product.id,
        productId: product.id,
        productName: product.name,
        unitName: product.subUnitName,
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
        lines: { include: { product: { select: { name: true, subUnitName: true } } } },
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
        productName: line.product.name,
        unitName: line.product.subUnitName,
        systemQty: line.systemQtyInSub.toNumber(),
        countedQty: line.countedQtyInSub.toNumber(),
        difference: line.differenceInSub.toNumber(),
      })),
    });
  } catch (error) {
    return actionError(error);
  }
}
