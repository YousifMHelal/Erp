import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  providers: [],
} satisfies NextAuthConfig;
