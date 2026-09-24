import {
  AuthRequiredError,
  PermissionDeniedError,
  requirePermission,
} from "@/lib/auth-guard";
import { BACKUP_FORMAT_VERSION, readAllTables, type BackupFile } from "@/lib/backup";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    await requirePermission("settings.backup");
    // Read-only snapshot — no cross-table invariant to protect at read time,
    // so this runs as plain queries rather than one interactive transaction
    // (which hit Prisma's 5s default timeout against Neon's real latency
    // across 20 tables; same class of bug logged in MEMORY.md for collections/payments).
    const data = await readAllTables(prisma);
    const setting = await prisma.setting.findUnique({ where: { key: "shop.name" } });
    const shopName = typeof setting?.value === "string" ? setting.value : undefined;
    const file: BackupFile = {
      formatVersion: BACKUP_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      shopName,
      data,
    };
    const body = JSON.stringify(file, (_key, value) =>
      value !== null && typeof value === "object" && "toFixed" in value ? value.toString() : value,
    );
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="teba-backup-${stamp}.json"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) return new Response(null, { status: 401 });
    if (error instanceof PermissionDeniedError) return new Response(null, { status: 403 });
    logError("Backup export failed", error);
    return new Response(null, { status: 500 });
  }
}
