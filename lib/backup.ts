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

export async function wipeAllTables(tx: BackupTx, models: readonly BackupModel[] = BACKUP_MODELS): Promise<void> {
  for (const model of [...models].reverse()) {
    const delegate = tx[model] as unknown as { deleteMany: () => Promise<unknown> };
    await delegate.deleteMany();
  }
}

export async function writeAllTables(
  tx: BackupTx,
  data: Record<BackupModel, unknown[]>,
  models: readonly BackupModel[] = BACKUP_MODELS,
): Promise<void> {
  for (const model of models) {
    const rows = data[model];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    const delegate = tx[model] as unknown as { createMany: (args: { data: unknown[] }) => Promise<unknown> };
    await delegate.createMany({ data: rows });
  }
}

// ---------------------------------------------------------------------------
// Scoped (partial) restore
// ---------------------------------------------------------------------------

/**
 * User-facing restore scopes. Each maps to a subset of BACKUP_MODELS grouped
 * the way a shop owner thinks about their data. Models NOT listed in any
 * named group (role, user, cashbox, auditLog, notification, setting,
 * documentCounter) are cross-cutting/system tables — they are only
 * restorable via the "all" scope, never exposed as a standalone group:
 *
 * - inventory: catalogue + stock ledger (Category, Product, StockMovement)
 * - customers: Customer master data only
 * - suppliers: Supplier master data only
 * - sales: the sale/transaction ledger that isn't Collection/Payment
 *   (Invoice, InvoiceLine, CashMovement, PartyTransaction, Stocktake,
 *   StocktakeLine)
 * - payments: cash-in/cash-out documents (Collection, Payment)
 * - all: every BACKUP_MODELS table — today's full-restore behavior,
 *   including the system tables above
 */
export const BACKUP_SCOPE_GROUPS = {
  inventory: ["category", "product", "stockMovement"],
  customers: ["customer"],
  suppliers: ["supplier"],
  sales: ["invoice", "invoiceLine", "cashMovement", "partyTransaction", "stocktake", "stocktakeLine"],
  payments: ["collection", "payment"],
} as const satisfies Record<string, readonly BackupModel[]>;

export type NamedBackupScope = keyof typeof BACKUP_SCOPE_GROUPS;
export type BackupScope = NamedBackupScope | "all";

const SCOPE_MODEL_SET = {} as Record<NamedBackupScope, ReadonlySet<BackupModel>>;
for (const scope of Object.keys(BACKUP_SCOPE_GROUPS) as NamedBackupScope[]) {
  SCOPE_MODEL_SET[scope] = new Set<BackupModel>(BACKUP_SCOPE_GROUPS[scope]);
}

/** Returns the BACKUP_MODELS-ordered subset of models covered by a scope. */
export function getModelsForScope(scope: BackupScope): readonly BackupModel[] {
  if (scope === "all") return BACKUP_MODELS;
  const set = SCOPE_MODEL_SET[scope];
  return BACKUP_MODELS.filter((model) => set.has(model));
}

/**
 * Foreign-key metadata for every BACKUP_MODELS model, hand-written from
 * schema.prisma (no runtime FK introspection available here). Each entry
 * lists the model's FK columns, whether the column is nullable (a null FK
 * value is always valid and skips the existence check), and the target
 * model it references. Keep in sync with schema.prisma.
 */
export type BackupForeignKey = {
  /** Field name on the backed-up row (matches the Prisma field name / JSON key). */
  field: string;
  /** Model the FK points at. */
  target: BackupModel;
  nullable: boolean;
};

export const BACKUP_FOREIGN_KEYS: Partial<Record<BackupModel, readonly BackupForeignKey[]>> = {
  user: [{ field: "roleId", target: "role", nullable: false }],
  product: [{ field: "categoryId", target: "category", nullable: true }],
  invoice: [
    { field: "customerId", target: "customer", nullable: true },
    { field: "supplierId", target: "supplier", nullable: true },
    { field: "cashboxId", target: "cashbox", nullable: false },
    { field: "createdById", target: "user", nullable: false },
    { field: "cancelledById", target: "user", nullable: true },
    { field: "originalInvoiceId", target: "invoice", nullable: true },
  ],
  invoiceLine: [
    { field: "invoiceId", target: "invoice", nullable: false },
    { field: "productId", target: "product", nullable: false },
  ],
  stockMovement: [
    { field: "productId", target: "product", nullable: false },
    { field: "invoiceId", target: "invoice", nullable: true },
    { field: "createdById", target: "user", nullable: false },
  ],
  cashMovement: [
    { field: "cashboxId", target: "cashbox", nullable: false },
    { field: "invoiceId", target: "invoice", nullable: true },
    { field: "customerId", target: "customer", nullable: true },
    { field: "supplierId", target: "supplier", nullable: true },
    { field: "createdById", target: "user", nullable: false },
  ],
  partyTransaction: [
    { field: "customerId", target: "customer", nullable: true },
    { field: "supplierId", target: "supplier", nullable: true },
    { field: "invoiceId", target: "invoice", nullable: true },
    { field: "createdById", target: "user", nullable: false },
  ],
  collection: [
    { field: "customerId", target: "customer", nullable: false },
    { field: "cashboxId", target: "cashbox", nullable: false },
    { field: "createdById", target: "user", nullable: false },
    { field: "cancelledById", target: "user", nullable: true },
  ],
  payment: [
    { field: "supplierId", target: "supplier", nullable: false },
    { field: "cashboxId", target: "cashbox", nullable: false },
    { field: "createdById", target: "user", nullable: false },
    { field: "cancelledById", target: "user", nullable: true },
  ],
  stocktake: [{ field: "createdById", target: "user", nullable: false }],
  stocktakeLine: [
    { field: "stocktakeId", target: "stocktake", nullable: false },
    { field: "productId", target: "product", nullable: false },
  ],
  auditLog: [{ field: "userId", target: "user", nullable: false }],
};

export type ScopedRestoreProblem = {
  model: BackupModel;
  field: string;
  target: BackupModel;
  missingIds: string[];
};

/**
 * Validates that restoring `models` (in FK-safe order) from `data` will not
 * leave dangling foreign keys in the live database. For each FK column on
 * each in-scope model, every referenced id must either:
 *  (a) already exist in the current live table for the target model (true
 *      for any target model NOT included in `models`, since that table is
 *      left untouched), or
 *  (b) exist among the backup file's own rows for the target model, when
 *      the target model IS included in `models` (it will be (re)created by
 *      this same restore, in FK-safe order, before the referencing rows).
 * Self-referential FKs (Invoice.originalInvoiceId) are checked against the
 * combined "will exist after restore" set for that same model.
 *
 * Returns an empty array when the restore is safe to perform.
 */
export async function validateScopedRestore(
  tx: BackupTx,
  models: readonly BackupModel[],
  data: Record<BackupModel, unknown[]>,
): Promise<ScopedRestoreProblem[]> {
  const modelSet = new Set(models);
  const problems: ScopedRestoreProblem[] = [];

  // Cache of ids present in the backup file per model (only needed for
  // in-scope target models) and ids present in the live DB per model (only
  // needed for out-of-scope target models referenced by an in-scope model).
  const backupIdCache = new Map<BackupModel, Set<string>>();
  const liveIdCache = new Map<BackupModel, Set<string>>();

  function backupIdsFor(model: BackupModel): Set<string> {
    let cached = backupIdCache.get(model);
    if (!cached) {
      const rows = (data[model] ?? []) as { id?: unknown }[];
      cached = new Set(rows.map((row) => row.id).filter((id): id is string => typeof id === "string"));
      backupIdCache.set(model, cached);
    }
    return cached;
  }

  async function liveIdsFor(model: BackupModel): Promise<Set<string>> {
    let cached = liveIdCache.get(model);
    if (!cached) {
      const delegate = tx[model] as unknown as { findMany: (args: { select: { id: true } }) => Promise<{ id: string }[]> };
      const rows = await delegate.findMany({ select: { id: true } });
      cached = new Set(rows.map((row) => row.id));
      liveIdCache.set(model, cached);
    }
    return cached;
  }

  for (const model of models) {
    const fks = BACKUP_FOREIGN_KEYS[model];
    if (!fks || fks.length === 0) continue;
    const rows = (data[model] ?? []) as Record<string, unknown>[];
    if (rows.length === 0) continue;

    for (const fk of fks) {
      // Ids this restore will make available for fk.target, once written.
      const allowedIds = modelSet.has(fk.target) ? backupIdsFor(fk.target) : await liveIdsFor(fk.target);

      const missing = new Set<string>();
      for (const row of rows) {
        const value = row[fk.field];
        if (value === null || value === undefined) {
          if (!fk.nullable) missing.add(String(value));
          continue;
        }
        if (typeof value !== "string") continue;
        if (!allowedIds.has(value)) missing.add(value);
      }
      if (missing.size > 0) {
        problems.push({ model, field: fk.field, target: fk.target, missingIds: [...missing] });
      }
    }
  }

  return problems;
}
