import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { decideMiddlewareAction } from "@/lib/middleware-policy";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const action = decideMiddlewareAction(
    request.nextUrl.pathname,
    request.nextUrl.search,
    Boolean(request.auth),
  );
  if (action.kind === "next") return NextResponse.next();
  return NextResponse.redirect(new URL(action.to, request.nextUrl));
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|webp|woff2)$).*)"],
};
