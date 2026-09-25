"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { fail, ok } from "@/lib/action-result";
import { logError } from "@/lib/logger";
import { writeAudit } from "@/lib/audit";
import { AuthRequiredError, requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema, updateProfileSchema } from "@/lib/validations";
import messages from "@/messages/ar.json";
import type { ActionResult, MyProfile } from "@/types";

const m = messages.profileAction;

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(m.unauthorized);
  logError("Profile action failed", error);
  return fail(m.failed);
}

export async function getMyProfile(): Promise<ActionResult<MyProfile>> {
  try {
    const user = await requireAuth();
    return ok({
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      avatarUrl: user.avatarUrl ?? undefined,
      avatarColor: user.avatarColor,
      roleName: user.role.name,
    });
  } catch (error) {
    return actionError(error);
  }
}

export async function updateMyProfile(input: unknown): Promise<ActionResult<MyProfile>> {
  try {
    const user = await requireAuth();
    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);

    const saved = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          displayName: parsed.data.displayName,
          username: parsed.data.username,
          avatarUrl: parsed.data.avatarUrl ?? null,
        },
      });
      await writeAudit(tx, {
        userId: user.id,
        action: "profile.update",
        entityType: "User",
        entityId: updated.id,
        entityLabel: m.profileEntityLabel,
        before: { displayName: user.displayName, username: user.username },
        after: { displayName: updated.displayName, username: updated.username },
      });
      return updated;
    });

    // Layout-level revalidation so the top-bar avatar/name update too, not just /profile.
    revalidatePath("/", "layout");
    return ok({
      id: saved.id,
      displayName: saved.displayName,
      username: saved.username,
      avatarUrl: saved.avatarUrl ?? undefined,
      avatarColor: saved.avatarColor,
      roleName: user.role.name,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      return fail(m.usernameTaken, { username: [m.usernameTaken] });
    return actionError(error);
  }
}

export async function changeMyPassword(input: unknown): Promise<ActionResult<null>> {
  try {
    const user = await requireAuth();
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);

    if (!(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)))
      return fail(m.wrongPassword, { currentPassword: [m.wrongPassword] });

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
      await writeAudit(tx, {
        userId: user.id,
        action: "profile.password.change",
        entityType: "User",
        entityId: user.id,
        entityLabel: m.passwordChangeLabel,
      });
    });

    revalidatePath("/settings/profile");
    return ok(null);
  } catch (error) {
    return actionError(error);
  }
}
