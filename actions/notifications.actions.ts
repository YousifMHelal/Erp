"use server";

import { revalidatePath } from "next/cache";
import { fail, ok } from "@/lib/action-result";
import { writeAudit } from "@/lib/audit";
import { AuthRequiredError, PermissionDeniedError, requirePermission } from "@/lib/auth-guard";
import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { partyIdSchema } from "@/lib/validations";
import messages from "@/messages/ar.json";
import type { ActionResult, NotificationItem } from "@/types";

const n = messages.notifications;

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(messages.reportAction.unauthorized);
  if (error instanceof PermissionDeniedError) return fail(messages.reportAction.forbidden);
  console.error("Notification action failed", error);
  return fail(n.failed);
}

function notificationText(titleKey: string, bodyParams: unknown) {
  const params = bodyParams as Record<string, string>;
  const key = titleKey as keyof typeof n.generated;
  const bodyKey = `${titleKey}Body` as keyof typeof n.generated;
  let body = n.generated[bodyKey] ?? "";
  for (const [name, value] of Object.entries(params)) {
    body = body.replaceAll(`{${name}}`, name === "balance" ? formatMoney(value) : value);
  }
  return { title: n.generated[key] ?? titleKey, body };
}

export async function getNotifications(): Promise<ActionResult<NotificationItem[]>> {
  try {
    await requirePermission("inventory.view");
    const rows = await prisma.notification.findMany({ orderBy: { createdAt: "desc" } });
    return ok(rows.map((row) => ({
      id: row.id, type: row.type, severity: row.severity, isRead: row.isRead,
      createdAt: row.createdAt.toISOString(), ...notificationText(row.titleKey, row.bodyParams),
      entityHref: row.entityType === "Product" ? `/inventory/${row.entityId}` : row.entityType === "Customer" ? `/customers/${row.entityId}` : row.entityType === "Supplier" ? `/suppliers/${row.entityId}` : undefined,
    })));
  } catch (error) { return actionError(error); }
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    await requirePermission("inventory.view");
    return await prisma.notification.count({ where: { isRead: false } });
  } catch (error) {
    if (error instanceof AuthRequiredError || error instanceof PermissionDeniedError) return 0;
    console.error("Notification count failed", error);
    return 0;
  }
}

export async function markNotificationRead(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("inventory.view");
    const parsed = partyIdSchema.safeParse(id);
    if (!parsed.success) return fail(n.failed);
    await prisma.$transaction(async (tx) => {
      await tx.notification.update({ where: { id: parsed.data }, data: { isRead: true, readAt: new Date() } });
      await writeAudit(tx, { userId: user.id, action: "notification.read", entityType: "Notification", entityId: parsed.data, entityLabel: parsed.data, after: { isRead: true } });
    });
    revalidatePath("/notifications");
    revalidatePath("/", "layout");
    return ok({ id: parsed.data });
  } catch (error) { return actionError(error); }
}

export async function markAllNotificationsRead(): Promise<ActionResult<{ count: number }>> {
  try {
    const user = await requirePermission("inventory.view");
    const count = await prisma.$transaction(async (tx) => {
      const updated = await tx.notification.updateMany({ where: { isRead: false }, data: { isRead: true, readAt: new Date() } });
      await writeAudit(tx, { userId: user.id, action: "notification.readAll", entityType: "Notification", entityId: "all", entityLabel: n.title, after: { count: updated.count } });
      return updated.count;
    });
    revalidatePath("/notifications");
    revalidatePath("/", "layout");
    return ok({ count });
  } catch (error) { return actionError(error); }
}

export async function deleteNotification(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("inventory.view");
    const parsed = partyIdSchema.safeParse(id);
    if (!parsed.success) return fail(n.failed);
    await prisma.$transaction(async (tx) => {
      const before = await tx.notification.delete({ where: { id: parsed.data } });
      const label = n.generated[before.titleKey as keyof typeof n.generated] ?? before.titleKey;
      await writeAudit(tx, { userId: user.id, action: "notification.delete", entityType: "Notification", entityId: before.id, entityLabel: label, before: { type: before.type, isRead: before.isRead } });
    });
    revalidatePath("/notifications");
    revalidatePath("/", "layout");
    return ok({ id: parsed.data });
  } catch (error) { return actionError(error); }
}
