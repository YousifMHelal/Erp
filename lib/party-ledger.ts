import { Prisma } from "@prisma/client";
import { syncNotifications } from "@/lib/notifications";

type PartyRef = { refType: string; refId: string };
type PartyKey = { kind: "customer" | "supplier"; id: string };

export type RemovedPartyEntries = {
  /** Date of the document's earliest removed statement row — re-stamped onto its replacement on edit. */
  firstOccurredAt?: Date;
  firstCreatedAt?: Date;
};

/**
 * Recomputes the running `balanceAfter` of every statement row for one customer or supplier in a
 * single statement, using the same order the statement displays (occurredAt, createdAt, id).
 * A party's balance is Σ(debit − credit), with the opening balance carried by its OPENING row.
 */
export async function rebuildPartyRunningBalance(tx: Prisma.TransactionClient, party: PartyKey): Promise<void> {
  if (party.kind === "customer") {
    await tx.$executeRaw`
      UPDATE "PartyTransaction" AS p
      SET "balanceAfter" = s.running
      FROM (
        SELECT id, SUM(debit - credit) OVER (ORDER BY "occurredAt", "createdAt", id) AS running
        FROM "PartyTransaction" WHERE "customerId" = ${party.id}
      ) AS s
      WHERE p.id = s.id AND p."balanceAfter" IS DISTINCT FROM s.running`;
  } else {
    await tx.$executeRaw`
      UPDATE "PartyTransaction" AS p
      SET "balanceAfter" = s.running
      FROM (
        SELECT id, SUM(debit - credit) OVER (ORDER BY "occurredAt", "createdAt", id) AS running
        FROM "PartyTransaction" WHERE "supplierId" = ${party.id}
      ) AS s
      WHERE p.id = s.id AND p."balanceAfter" IS DISTINCT FROM s.running`;
  }
}

function partyOf(row: { customerId: string | null; supplierId: string | null }): PartyKey | undefined {
  if (row.customerId) return { kind: "customer", id: row.customerId };
  if (row.supplierId) return { kind: "supplier", id: row.supplierId };
  return undefined;
}

/**
 * Takes a document's effect off customer/supplier accounts by deleting its statement rows (rather
 * than writing cancelling rows), so statements only show what currently exists. Balances are
 * adjusted by the removed rows' net, which also cleans up legacy reversal pairs.
 */
export async function removeDocumentPartyEntries(
  tx: Prisma.TransactionClient,
  ref: PartyRef,
): Promise<RemovedPartyEntries> {
  const rows = await tx.partyTransaction.findMany({
    where: ref,
    select: { customerId: true, supplierId: true, debit: true, credit: true, occurredAt: true, createdAt: true },
    orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
  });
  const first = rows[0];
  if (!first) return {};

  const nets = new Map<string, { party: PartyKey; net: Prisma.Decimal }>();
  for (const row of rows) {
    const party = partyOf(row);
    if (!party) continue;
    const key = `${party.kind}:${party.id}`;
    const entry = nets.get(key) ?? { party, net: new Prisma.Decimal(0) };
    entry.net = entry.net.plus(row.debit).minus(row.credit);
    nets.set(key, entry);
  }
  for (const { party, net } of nets.values()) {
    if (net.isZero()) continue;
    if (party.kind === "customer") {
      await tx.customer.update({ where: { id: party.id }, data: { balance: { decrement: net } } });
    } else {
      await tx.supplier.update({ where: { id: party.id }, data: { balance: { decrement: net } } });
    }
  }
  await tx.partyTransaction.deleteMany({ where: ref });
  for (const { party } of nets.values()) await rebuildPartyRunningBalance(tx, party);

  const parties = [...nets.values()].map(({ party }) => party);
  await syncNotifications(tx, {
    customerIds: parties.filter((party) => party.kind === "customer").map((party) => party.id),
    supplierIds: parties.filter((party) => party.kind === "supplier").map((party) => party.id),
  });

  return { firstOccurredAt: first.occurredAt, firstCreatedAt: first.createdAt };
}

/** After an edit re-posts a document, moves its new statement rows back to the original date so they keep their place. */
export async function restampDocumentPartyEntries(
  tx: Prisma.TransactionClient,
  ref: PartyRef,
  removed: RemovedPartyEntries,
): Promise<void> {
  if (!removed.firstOccurredAt || !removed.firstCreatedAt) return;
  const rows = await tx.partyTransaction.findMany({ where: ref, select: { customerId: true, supplierId: true } });
  if (rows.length === 0) return;
  await tx.partyTransaction.updateMany({
    where: ref,
    data: { occurredAt: removed.firstOccurredAt, createdAt: removed.firstCreatedAt },
  });
  const parties = new Map<string, PartyKey>();
  for (const row of rows) {
    const party = partyOf(row);
    if (party) parties.set(`${party.kind}:${party.id}`, party);
  }
  for (const party of parties.values()) await rebuildPartyRunningBalance(tx, party);
}
