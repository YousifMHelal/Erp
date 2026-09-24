import type { Prisma, PrismaClient } from "@prisma/client";

export const BACKUP_FORMAT_VERSION = 1;

/**
 * Every Prisma model, ordered so that restoring top-to-bottom never violates
 * a foreign key (parents before children) and wiping bottom-to-top never
 * does either (children before parents). Keep in sync with schema.prisma —
 * a model missing here is silently excluded from backup/restore.
 */
export const BACKUP_MODELS = [
  "role",
  "user",
  "category",
  "product",
  "customer",
  "supplier",
  "cashbox",
  "invoice",
  "invoiceLine",
  "stockMovement",
  "cashMovement",
  "partyTransaction",
  "collection",
  "payment",
  "stocktake",
  "stocktakeLine",
  "auditLog",
  "notification",
  "setting",
  "documentCounter",
] as const;

export type BackupModel = (typeof BACKUP_MODELS)[number];

export type BackupFile = {
  formatVersion: number;
  exportedAt: string;
  shopName?: string;
  data: Record<BackupModel, unknown[]>;
};

type BackupTx = Prisma.TransactionClient;

export async function readAllTables(client: PrismaClient | BackupTx): Promise<Record<BackupModel, unknown[]>> {
  const entries = await Promise.all(
    BACKUP_MODELS.map(async (model) => {
      const delegate = client[model] as unknown as { findMany: () => Promise<unknown[]> };
      return [model, await delegate.findMany()] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<BackupModel, unknown[]>;
}

export async function wipeAllTables(tx: BackupTx): Promise<void> {
  for (const model of [...BACKUP_MODELS].reverse()) {
    const delegate = tx[model] as unknown as { deleteMany: () => Promise<unknown> };
    await delegate.deleteMany();
  }
}

export async function writeAllTables(tx: BackupTx, data: Record<BackupModel, unknown[]>): Promise<void> {
  for (const model of BACKUP_MODELS) {
    const rows = data[model];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    const delegate = tx[model] as unknown as { createMany: (args: { data: unknown[] }) => Promise<unknown> };
    await delegate.createMany({ data: rows });
  }
}
