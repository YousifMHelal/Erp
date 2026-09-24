import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ALL_PERMISSIONS } from "@/lib/permissions";

const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin@123";
const DEFAULT_ADMIN_DISPLAY_NAME = "مدير النظام";
const DEFAULT_ADMIN_ROLE_NAME = "مدير";

/**
 * First-run safety net: if the database has no users at all (fresh install,
 * or every account got deleted), create one manager-role admin so the app
 * is never left with no way to log in. Cheap no-op after the first user
 * exists — safe to call on every /login render.
 */
export async function ensureDefaultAdmin(): Promise<void> {
  const userCount = await prisma.user.count();
  if (userCount > 0) return;

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  await prisma.$transaction(async (tx) => {
    // Re-check inside the transaction — two concurrent first requests could
    // both pass the count check above before either has created a user.
    const stillEmpty = (await tx.user.count()) === 0;
    if (!stillEmpty) return;

    const role = await tx.role.upsert({
      where: { name: DEFAULT_ADMIN_ROLE_NAME },
      create: {
        name: DEFAULT_ADMIN_ROLE_NAME,
        description: "صلاحية كاملة على كل أجزاء النظام",
        isSystem: true,
        permissions: ALL_PERMISSIONS,
      },
      update: {},
    });

    await tx.user.create({
      data: {
        username: DEFAULT_ADMIN_USERNAME,
        displayName: DEFAULT_ADMIN_DISPLAY_NAME,
        passwordHash,
        avatarColor: "#2A2F6B",
        roleId: role.id,
      },
    });
  });

  console.log(
    JSON.stringify({
      level: "warn",
      time: new Date().toISOString(),
      context: "bootstrap.admin.created",
      message: "No users existed — created a default admin account. Change its password immediately.",
      username: DEFAULT_ADMIN_USERNAME,
    }),
  );
}
