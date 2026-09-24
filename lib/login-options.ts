import { prisma } from "@/lib/prisma";
import { ensureDefaultAdmin } from "@/lib/bootstrap-admin";
import { getLoginMode } from "@/lib/login-mode";
import type { PublicLoginOptions } from "@/types";

export async function getPublicLoginOptions(): Promise<PublicLoginOptions> {
  await ensureDefaultAdmin();

  const mode = await getLoginMode();
  if (mode === "username") return { mode, users: [] };

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true, role: { select: { name: true } } },
  });
  return {
    mode,
    users: users.map((user) => ({
      id: user.id,
      displayName: user.displayName,
      roleName: user.role.name,
    })),
  };
}
