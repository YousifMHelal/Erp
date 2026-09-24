"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { fail, ok } from "@/lib/action-result";
import { logError } from "@/lib/logger";
import { AuthRequiredError, PermissionDeniedError, requirePermission } from "@/lib/auth-guard";
import { BACKUP_MODELS, wipeAllTables, writeAllTables, type BackupFile } from "@/lib/backup";
import { prisma } from "@/lib/prisma";
import { restoreBackupSchema } from "@/lib/validations";
import messages from "@/messages/ar.json";
import type { ActionResult } from "@/types";

const m = messages.settingsAction;

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(m.unauthorized);
  if (error instanceof PermissionDeniedError) return fail(m.forbidden);
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

export async function restoreBackup(input: unknown): Promise<ActionResult<null>> {
  try {
    const user = await requirePermission("settings.manage");
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

    await prisma.$transaction(
      async (tx) => {
        await wipeAllTables(tx);
        await writeAllTables(tx, file.data);
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
