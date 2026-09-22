import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { username: {}, userId: {}, password: { type: "password" } },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

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
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id ?? "";
        token.displayName = user.displayName;
        token.roleId = user.roleId;
        token.permissions = user.permissions;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.userId;
      session.user.displayName = token.displayName;
      session.user.roleId = token.roleId;
      session.user.permissions = token.permissions;
      return session;
    },
  },
});
