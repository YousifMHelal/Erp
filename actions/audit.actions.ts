"use server";

import { fail, ok } from "@/lib/action-result";
import { AuthRequiredError, PermissionDeniedError, requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { reportDateRange } from "@/lib/report-queries";
import { auditLogFilterSchema } from "@/lib/validations";
import messages from "@/messages/ar.json";
import type { ActionResult, AuditLogPageData } from "@/types";

function actionError(error: unknown): ActionResult<AuditLogPageData> {
  if (error instanceof AuthRequiredError) return fail(messages.reportAction.unauthorized);
  if (error instanceof PermissionDeniedError) return fail(messages.reportAction.forbidden);
  console.error("Audit log action failed", error);
  return fail(messages.auditLog.failed);
}

export async function getAuditLog(input: unknown): Promise<ActionResult<AuditLogPageData>> {
  try {
    await requirePermission("audit.view");
    const parsed = auditLogFilterSchema.safeParse(input);
    if (!parsed.success) return fail(messages.auditLog.failed, parsed.error.flatten().fieldErrors);
    const filters = parsed.data;
    const date = reportDateRange(filters);
    const where = { userId: filters.userId, action: filters.action, entityType: filters.entityType, createdAt: date };
    const pageSize = 50;
    const page = filters.page ?? 1;
    const [totalCount, entries, users, actions, entityTypes] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where, include: { user: { select: { displayName: true } } }, orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.user.findMany({ orderBy: { displayName: "asc" }, select: { id: true, displayName: true } }),
      prisma.auditLog.findMany({ distinct: ["action"], orderBy: { action: "asc" }, select: { action: true } }),
      prisma.auditLog.findMany({ distinct: ["entityType"], orderBy: { entityType: "asc" }, select: { entityType: true } }),
    ]);
    return ok({
      entries: entries.map((entry) => ({
        id: entry.id, userName: entry.user.displayName, action: entry.action,
        entityLabel: entry.entityLabel, createdAt: entry.createdAt.toISOString(),
        beforeJson: entry.beforeJson as Record<string, unknown> | undefined,
        afterJson: entry.afterJson as Record<string, unknown> | undefined,
      })),
      users: users.map((user) => ({ value: user.id, label: user.displayName })),
      actions: actions.map(({ action }) => ({ value: action, label: action })),
      entityTypes: entityTypes.map(({ entityType }) => ({ value: entityType, label: entityType })),
      page, pageCount: Math.max(1, Math.ceil(totalCount / pageSize)), totalCount,
    });
  } catch (error) { return actionError(error); }
}
