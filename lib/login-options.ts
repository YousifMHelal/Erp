import { prisma } from "@/lib/prisma";
import { ensureDefaultAdmin } from "@/lib/bootstrap-admin";
import type { PublicLoginOptions } from "@/types";

export async function getPublicLoginOptions(): Promise<PublicLoginOptions> {
  await ensureDefaultAdmin();

  const setting = await prisma.setting.findUnique({
    where: { key: "loginMode" },
  });
  const mode = setting?.value === "tiles" ? "tiles" : "username";
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
