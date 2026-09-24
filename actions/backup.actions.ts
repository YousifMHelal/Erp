"use server";

import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { fail, ok } from "@/lib/action-result";
import { logError } from "@/lib/logger";
import { AuthRequiredError, PermissionDeniedError, requireAuth, requirePermission } from "@/lib/auth-guard";
import { isBackupReminderDue } from "@/lib/backup-reminder";
import { BACKUP_MODELS, getModelsForScope, validateScopedRestore, wipeAllTables, writeAllTables, type BackupFile } from "@/lib/backup";
import { prisma } from "@/lib/prisma";
import { backupReminderSchema, restoreBackupSchema } from "@/lib/validations";
import messages from "@/messages/ar.json";
import type { ActionResult, BackupReminderSettings } from "@/types";

const m = messages.settingsAction;
const REMINDER_KEYS: string[] = ["backup.reminderFrequency", "backup.reminderTime", "backup.reminderDayOfWeek", "backup.reminderDayOfMonth", "backup.reminderLastFiredAt"];
const DEFAULT_REMINDER: BackupReminderSettings = { frequency: "off", time: "09:00" };

/** Thrown inside the restore transaction when the pre-flight FK check fails, so it can be surfaced as a clear ActionResult instead of a raw Postgres FK violation. */
class ScopedRestoreValidationError extends Error {}

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(m.unauthorized);
  if (error instanceof PermissionDeniedError) return fail(m.forbidden);
  if (error instanceof ScopedRestoreValidationError) return fail(error.message);
  logError("Backup restore failed", error);
  return fail(m.backupRestoreFailed);
}

function isValidBackupFile(value: unknown): value is BackupFile {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.formatVersion !== "number") return false;
  if (!candidate.data || typeof candidate.data !== "object") return false;
  const data = candidate.data as Record<string, unknown>;
  return BACKUP_MODELS.every((model) => Array.isArray(data[model]));
}

/** Arabic labels for BackupModel, used to build a readable FK-problem message. */
const MODEL_LABELS: Record<string, string> = {
  role: "الأدوار",
  user: "المستخدمين",
  category: "الفئات",
  product: "الأصناف",
  customer: "العملاء",
  supplier: "الموردين",
  cashbox: "الخزائن",
  invoice: "الفواتير",
  invoiceLine: "بنود الفواتير",
  stockMovement: "حركات المخزون",
  cashMovement: "حركات الخزينة",
  partyTransaction: "حركات الحساب",
  collection: "التحصيلات",
  payment: "المدفوعات",
  stocktake: "الجرد",
  stocktakeLine: "بنود الجرد",
  auditLog: "سجل التدقيق",
  notification: "الإشعارات",
  setting: "الإعدادات",
  documentCounter: "عدادات المستندات",
};

function describeScopedRestoreProblems(problems: { model: string; target: string; missingIds: string[] }[]): string {
  const targets = [...new Set(problems.map((p) => MODEL_LABELS[p.target] ?? p.target))];
  return m.backupScopeMissingRefs.replace("{targets}", targets.join("، "));
}

export async function restoreBackup(input: unknown): Promise<ActionResult<null>> {
  try {
    const user = await requirePermission("settings.backup");
    const parsed = restoreBackupSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);

    if (!(await bcrypt.compare(parsed.data.password, user.passwordHash)))
      return fail(m.backupWrongPassword);

    let file: unknown;
    try {
      file = JSON.parse(parsed.data.fileContent);
    } catch {
      return fail(m.backupInvalidFile);
    }
    if (!isValidBackupFile(file)) return fail(m.backupInvalidFile);

    const scope = parsed.data.scope;
    const models = getModelsForScope(scope);

    await prisma.$transaction(
      async (tx) => {
        if (scope !== "all") {
          const problems = await validateScopedRestore(tx, models, file.data);
          if (problems.length > 0) throw new ScopedRestoreValidationError(describeScopedRestoreProblems(problems));
        }
        await wipeAllTables(tx, models);
        await writeAllTables(tx, file.data, models);
      },
      { timeout: 60_000 },
    );

    // The restored dataset replaces AuditLog wholesale and may not contain
    // the acting user's id, so this restore event can't be written as a row
    // referencing it inside the same transaction — logged structurally instead.
    console.log(
      JSON.stringify({
        level: "info",
        time: new Date().toISOString(),
        context: "settings.backup.restore",
        userId: user.id,
        displayName: user.displayName,
        exportedAt: file.exportedAt,
      }),
    );

    revalidatePath("/");
    return ok(null);
  } catch (error) {
    return actionError(error);
  }
}

function parseReminderSettings(rows: { key: string; value: unknown }[]): BackupReminderSettings {
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const frequency = values.get("backup.reminderFrequency");
  const time = values.get("backup.reminderTime");
  const dayOfWeek = values.get("backup.reminderDayOfWeek");
  const dayOfMonth = values.get("backup.reminderDayOfMonth");
  return {
    frequency: frequency === "daily" || frequency === "weekly" || frequency === "monthly" ? frequency : "off",
    time: typeof time === "string" ? time : DEFAULT_REMINDER.time,
    dayOfWeek: typeof dayOfWeek === "number" ? dayOfWeek : undefined,
    dayOfMonth: typeof dayOfMonth === "number" ? dayOfMonth : undefined,
  };
}

export async function getBackupReminder(): Promise<ActionResult<BackupReminderSettings>> {
  try {
    await requirePermission("settings.backup");
    const rows = await prisma.setting.findMany({ where: { key: { in: REMINDER_KEYS } } });
    return ok(parseReminderSettings(rows));
  } catch (error) {
    return actionError(error);
  }
}

export async function saveBackupReminder(input: unknown): Promise<ActionResult<null>> {
  try {
    const user = await requirePermission("settings.backup");
    const parsed = backupReminderSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);

    await prisma.$transaction(async (tx) => {
      const entries: [string, Prisma.InputJsonValue | null][] = [
        ["backup.reminderFrequency", parsed.data.frequency],
        ["backup.reminderTime", parsed.data.time],
        ["backup.reminderDayOfWeek", parsed.data.dayOfWeek ?? null],
        ["backup.reminderDayOfMonth", parsed.data.dayOfMonth ?? null],
      ];
      for (const [key, value] of entries) {
        if (value === null) {
          await tx.setting.deleteMany({ where: { key } });
          continue;
        }
        await tx.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
      }
      // Changing the schedule invalidates any prior "already fired" state.
      await tx.setting.deleteMany({ where: { key: "backup.reminderLastFiredAt" } });
      await writeAuditRow(tx, user.id, parsed.data);
    });

    revalidatePath("/settings/backup");
    return ok(null);
  } catch (error) {
    return actionError(error);
  }
}

async function writeAuditRow(tx: Prisma.TransactionClient, userId: string, after: unknown) {
  await tx.auditLog.create({
    data: {
      userId,
      action: "settings.backup.reminder.update",
      entityType: "Setting",
      entityId: "backup-reminder",
      entityLabel: m.backupReminderEntityLabel,
      afterJson: after as Prisma.InputJsonObject,
    },
  });
}

/**
 * Opportunistic time-based check — this app has no cron/background process,
 * so a due reminder fires the next time anyone loads the dashboard after the
 * scheduled moment has passed, not at the exact configured second.
 */
export async function syncBackupReminder(): Promise<void> {
  try {
    await requireAuth();
    const rows = await prisma.setting.findMany({ where: { key: { in: REMINDER_KEYS } } });
    const config = parseReminderSettings(rows);
    const lastFiredAt = rows.find((row) => row.key === "backup.reminderLastFiredAt")?.value;
    const due = isBackupReminderDue({ ...config, lastFiredAt: typeof lastFiredAt === "string" ? lastFiredAt : undefined });
    if (!due) return;

    const now = new Date().toISOString();
    await prisma.$transaction(async (tx) => {
      await tx.setting.upsert({
        where: { key: "backup.reminderLastFiredAt" },
        create: { key: "backup.reminderLastFiredAt", value: now },
        update: { value: now },
      });
      await tx.notification.upsert({
        where: { dedupeKey: `backup-reminder:${now.slice(0, 10)}` },
        create: {
          dedupeKey: `backup-reminder:${now.slice(0, 10)}`,
          type: "SYSTEM",
          severity: "INFO",
          titleKey: "backupReminder",
          bodyParams: {} as Prisma.InputJsonObject,
          entityType: "Setting",
          entityId: "backup",
        },
        update: {},
      });
    });
  } catch {
    // Best-effort — a reminder that fails to fire shouldn't break the dashboard.
  }
}
