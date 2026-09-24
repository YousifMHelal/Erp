import { prisma } from "@/lib/prisma";

/**
 * Reads the shop's `loginMode` setting. Defaults to "tiles" whenever the
 * setting row is missing (fresh/wiped database) — only an explicit
 * "username" value switches to the plain username/password form.
 */
export async function getLoginMode(): Promise<"tiles" | "username"> {
  const setting = await prisma.setting.findUnique({ where: { key: "loginMode" } });
  return setting?.value === "username" ? "username" : "tiles";
}
