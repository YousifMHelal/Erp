export type MiddlewareAction =
  | { kind: "next" }
  | { kind: "redirect"; to: string };

/**
 * Pure routing decision for the auth middleware, isolated from NextAuth/
 * next/server so it can run outside the edge runtime (e.g. in tests).
 */
export function decideMiddlewareAction(
  pathname: string,
  search: string,
  isAuthenticated: boolean,
): MiddlewareAction {
  if (pathname.startsWith("/api/auth") || pathname === "/api/health") return { kind: "next" };
  if (pathname === "/login") {
    return isAuthenticated ? { kind: "redirect", to: "/" } : { kind: "next" };
  }
  if (!isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname + search);
    return { kind: "redirect", to: `/login?callbackUrl=${callbackUrl}` };
  }
  return { kind: "next" };
}
