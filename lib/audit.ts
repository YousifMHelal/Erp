import type { Prisma } from "@prisma/client";
import type { AuditInput } from "@/types";

function snapshot(value: Record<string, unknown>): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
}

export async function writeAudit(
  tx: Prisma.TransactionClient,
  input: AuditInput,
) {
  const before = input.before ? snapshot(input.before) : undefined;
  const after = input.after ? snapshot(input.after) : undefined;
  const changedKeys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);
  const changed = [...changedKeys].filter(
    (key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]),
  );

  return tx.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel,
      beforeJson: before
        ? Object.fromEntries(changed.map((key) => [key, before[key]]))
        : undefined,
      afterJson: after
        ? Object.fromEntries(changed.map((key) => [key, after[key]]))
        : undefined,
    },
  });
}
