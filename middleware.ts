import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/auth")) return NextResponse.next();
  if (path === "/login") {
    return request.auth ? NextResponse.redirect(new URL("/", request.nextUrl)) : NextResponse.next();
  }
  if (!request.auth) {
    const login = new URL("/login", request.nextUrl);
    login.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|webp|woff2)$).*)"],
};
