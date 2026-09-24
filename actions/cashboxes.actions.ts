"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { AuthRequiredError, PermissionDeniedError, requirePermission } from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/action-result";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { transferCashSchema } from "@/lib/validations";
import messages from "@/messages/ar.json";
import type { ActionResult, CashboxesViewProps, CashMovementRow } from "@/types";

const m = messages.cashboxAction;

class CashboxDomainError extends Error {
  constructor(public readonly code: "notFound" | "insufficient") { super(code); }
}

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(m.unauthorized);
  if (error instanceof PermissionDeniedError) return fail(m.forbidden);
  if (error instanceof CashboxDomainError) return fail(m[error.code]);
  logError("Cashbox action failed", error);
  return fail(m.failed);
}

export async function getCashboxOverview(): Promise<ActionResult<CashboxesViewProps>> {
  try {
    await requirePermission("cashbox.view");
    const [cashboxes, movements] = await Promise.all([
      prisma.cashbox.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
      prisma.cashMovement.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          cashbox: { select: { name: true } },
          customer: { select: { name: true } },
          supplier: { select: { name: true } },
          invoice: { select: { number: true, type: true } },
        },
      }),
    ]);
    const collectionIds = movements.filter((movement) => movement.refType === "COLLECTION").map((movement) => movement.refId);
    const paymentIds = movements.filter((movement) => movement.refType === "PAYMENT").map((movement) => movement.refId);
    const [collections, payments] = await Promise.all([
      prisma.collection.findMany({ where: { id: { in: collectionIds } }, select: { id: true, number: true } }),
      prisma.payment.findMany({ where: { id: { in: paymentIds } }, select: { id: true, number: true } }),
    ]);
    const collectionNumbers = new Map(collections.map((collection) => [collection.id, collection.number]));
    const paymentNumbers = new Map(payments.map((payment) => [payment.id, payment.number]));
    const transferLegs = new Map<string, typeof movements>();
    for (const movement of movements) {
      if (!movement.transferId) continue;
      const legs = transferLegs.get(movement.transferId);
      if (legs) legs.push(movement);
      else transferLegs.set(movement.transferId, [movement]);
    }
    const transferPeers = new Map<string, string>();
    for (const legs of transferLegs.values()) {
      for (const leg of legs) {
        const peer = legs.find((other) => other.cashboxId !== leg.cashboxId);
        if (peer) transferPeers.set(`${leg.transferId}:${leg.cashboxId}`, peer.cashbox.name);
      }
    }
    const rows: CashMovementRow[] = movements.map((movement) => {
      const referenceNumber = movement.refType === "COLLECTION"
        ? collectionNumbers.get(movement.refId)
        : movement.refType === "PAYMENT" ? paymentNumbers.get(movement.refId) : movement.invoice?.number;
      const documentLabel = movement.refType === "COLLECTION"
        ? messages.partyStatement.collection
        : movement.refType === "PAYMENT" ? messages.partyStatement.payment : messages.partyStatement.invoice;
      const peerName = movement.transferId ? transferPeers.get(`${movement.transferId}:${movement.cashboxId}`) : undefined;
      return {
        id: movement.id,
        cashboxId: movement.cashboxId,
        cashboxName: movement.cashbox.name,
        type: movement.type,
        amount: movement.amount.toString(),
        balanceAfter: movement.balanceAfter.toString(),
        partyName: movement.customer?.name ?? movement.supplier?.name,
        refLabel: referenceNumber !== undefined
          ? documentLabel.replace("{number}", String(referenceNumber).padStart(6, "0"))
          : peerName ? `${messages.cashboxes.transferDialog.refLabel} ${peerName}` : messages.cashboxes.movementType[movement.type],
        refType: movement.invoice?.type === "SALE" || movement.invoice?.type === "PURCHASE"
          ? movement.invoice.type
          : movement.refType === "COLLECTION" || movement.refType === "PAYMENT" ? movement.refType : undefined,
        refId: movement.invoice?.type === "SALE" || movement.invoice?.type === "PURCHASE"
          ? movement.invoiceId ?? undefined
          : movement.refType === "COLLECTION" || movement.refType === "PAYMENT" ? movement.refId : undefined,
        createdAt: movement.createdAt.toISOString(),
      };
    });
    return ok({
      cashboxes: cashboxes.map((cashbox) => ({ id: cashbox.id, name: cashbox.name, balance: cashbox.balance.toString() })),
      movements: rows,
    });
  } catch (error) {
    return actionError(error);
  }
}

export async function transferCash(input: unknown): Promise<ActionResult<{ transferId: string }>> {
  try {
    const user = await requirePermission("cashbox.transfer");
    const parsed = transferCashSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const { fromCashboxId, toCashboxId } = parsed.data;
    const amount = new Prisma.Decimal(parsed.data.amount);
    const transferId = randomUUID();
    await prisma.$transaction(async (tx) => {
      const destination = await tx.cashbox.findFirst({ where: { id: toCashboxId, isActive: true } });
      if (!destination) throw new CashboxDomainError("notFound");
      const source = await tx.cashbox.updateMany({
        where: { id: fromCashboxId, isActive: true, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (source.count !== 1) throw new CashboxDomainError("insufficient");
      const [from, to] = await Promise.all([
        tx.cashbox.findUniqueOrThrow({ where: { id: fromCashboxId } }),
        tx.cashbox.update({ where: { id: toCashboxId }, data: { balance: { increment: amount } } }),
      ]);
      await tx.cashMovement.createMany({
        data: [
          { cashboxId: fromCashboxId, type: "TRANSFER_OUT", amount: amount.negated(), balanceAfter: from.balance,
            refType: "TRANSFER", refId: transferId, transferId, createdById: user.id },
          { cashboxId: toCashboxId, type: "TRANSFER_IN", amount, balanceAfter: to.balance,
            refType: "TRANSFER", refId: transferId, transferId, createdById: user.id },
        ],
      });
      await writeAudit(tx, {
        userId: user.id, action: "cashbox.transfer", entityType: "CashTransfer",
        entityId: transferId, entityLabel: `${from.name} → ${to.name}`,
        after: { fromCashboxId, toCashboxId, amount: amount.toString() },
      });
    });
    revalidatePath("/cashboxes");
    return ok({ transferId });
  } catch (error) {
    return actionError(error);
  }
}
