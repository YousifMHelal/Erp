import { Prisma } from "@prisma/client";

type CashRef = { refType: string; refId: string };

export type RemovedCash = {
  /** Timestamp of the document's earliest removed movement — re-stamped onto its replacement on edit. */
  firstMovedAt?: Date;
};

/**
 * Recomputes every movement's running `balanceAfter` for one cashbox in a single statement:
 * opening balance + cumulative sum, ordered by time. Needed whenever a movement is removed or
 * back-dated, since later rows' running balances shift.
 */
export async function rebuildCashboxRunningBalance(tx: Prisma.TransactionClient, cashboxId: string): Promise<void> {
  await tx.$executeRaw`
    UPDATE "CashMovement" AS m
    SET "balanceAfter" = s.running
    FROM (
      SELECT cm.id, c."openingBalance" + SUM(cm.amount) OVER (ORDER BY cm."createdAt", cm.id) AS running
      FROM "CashMovement" cm
      JOIN "Cashbox" c ON c.id = cm."cashboxId"
      WHERE cm."cashboxId" = ${cashboxId}
    ) AS s
    WHERE m.id = s.id AND m."balanceAfter" IS DISTINCT FROM s.running`;
}

/**
 * Takes a document's cash effect back out by deleting its movements (rather than writing
 * cancelling rows), so the cashbox list only ever shows what currently exists. The cashbox
 * balance is adjusted by the sum of the removed rows, which also cleans up any legacy
 * reversal pairs left by the old ledger behaviour.
 */
export async function removeDocumentCash(tx: Prisma.TransactionClient, ref: CashRef): Promise<RemovedCash> {
  const rows = await tx.cashMovement.findMany({
    where: ref,
    select: { cashboxId: true, amount: true, createdAt: true },
  });
  if (rows.length === 0) return {};

  const totals = new Map<string, Prisma.Decimal>();
  for (const row of rows) {
    totals.set(row.cashboxId, (totals.get(row.cashboxId) ?? new Prisma.Decimal(0)).plus(row.amount));
  }
  for (const [cashboxId, total] of totals) {
    if (!total.isZero()) {
      await tx.cashbox.update({ where: { id: cashboxId }, data: { balance: { decrement: total } } });
    }
  }
  await tx.cashMovement.deleteMany({ where: ref });
  for (const cashboxId of totals.keys()) await rebuildCashboxRunningBalance(tx, cashboxId);

  const firstMovedAt = rows.reduce((earliest, row) => (row.createdAt < earliest ? row.createdAt : earliest), rows[0]!.createdAt);
  return { firstMovedAt };
}

/** After an edit re-posts a document, moves its new cash rows back to the original date so it keeps its place in the list. */
export async function restampDocumentCash(
  tx: Prisma.TransactionClient,
  ref: CashRef,
  movedAt: Date | undefined,
): Promise<void> {
  if (!movedAt) return;
  const rows = await tx.cashMovement.findMany({ where: ref, select: { cashboxId: true } });
  if (rows.length === 0) return;
  await tx.cashMovement.updateMany({ where: ref, data: { createdAt: movedAt } });
  for (const cashboxId of new Set(rows.map((row) => row.cashboxId))) {
    await rebuildCashboxRunningBalance(tx, cashboxId);
  }
}
