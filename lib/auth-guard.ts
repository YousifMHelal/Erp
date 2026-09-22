import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasPermission, isPermissionKey } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export class AuthRequiredError extends Error {}
export class PermissionDeniedError extends Error {}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findFirst({
    where: { id: session.user.id, isActive: true },
    include: { role: true },
  });
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(key: string) {
  if (!isPermissionKey(key)) throw new Error(`Unknown permission: ${key}`);
  const user = await getCurrentUser();
  if (!user) throw new AuthRequiredError();
  if (!hasPermission(user.role.permissions, key))
    throw new PermissionDeniedError();
  return user;
}
