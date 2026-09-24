import bcrypt from "bcryptjs";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultAdmin } from "@/lib/bootstrap-admin";
import { loginSchema } from "@/lib/validations";

export async function authorizeCredentials(credentials: unknown) {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return null;

  await ensureDefaultAdmin();

  if (parsed.data.userId) {
    const mode = await prisma.setting.findUnique({
      where: { key: "loginMode" },
    });
    if (mode?.value !== "tiles") return null;
  }
  const user = await prisma.user.findUnique({
    where: parsed.data.userId
      ? { id: parsed.data.userId }
      : { username: parsed.data.username },
    include: { role: true },
  });
  if (!user?.isActive) return null;
  if (!(await bcrypt.compare(parsed.data.password, user.passwordHash)))
    return null;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "auth.login",
        entityType: "User",
        entityId: user.id,
        entityLabel: user.displayName,
      },
    });
  });
  return {
    id: user.id,
    name: user.displayName,
    displayName: user.displayName,
    roleId: user.roleId,
    permissions: user.role.permissions,
  };
}

export function jwtCallback({ token, user }: { token: JWT; user?: User }): JWT {
  if (user) {
    token.userId = user.id ?? "";
    token.displayName = user.displayName;
    token.roleId = user.roleId;
    token.permissions = user.permissions;
  }
  return token;
}

export function sessionCallback({
  session,
  token,
}: {
  session: Session;
  token: JWT;
}): Session {
  session.user.id = token.userId;
  session.user.displayName = token.displayName;
  session.user.roleId = token.roleId;
  session.user.permissions = token.permissions;
  return session;
}
