import { describe, expect, it } from "vitest";
import { decideMiddlewareAction } from "@/lib/middleware-policy";

describe("decideMiddlewareAction", () => {
  it("always passes through NextAuth's own API routes", () => {
    expect(decideMiddlewareAction("/api/auth/session", "", false)).toEqual({
      kind: "next",
    });
    expect(decideMiddlewareAction("/api/auth/session", "", true)).toEqual({
      kind: "next",
    });
  });

  it("redirects an authenticated user away from /login", () => {
    expect(decideMiddlewareAction("/login", "", true)).toEqual({
      kind: "redirect",
      to: "/",
    });
  });

  it("allows an unauthenticated user to reach /login", () => {
    expect(decideMiddlewareAction("/login", "", false)).toEqual({
      kind: "next",
    });
  });

  it("redirects an unauthenticated user to /login with the original path as callbackUrl", () => {
    const result = decideMiddlewareAction("/sales/new", "", false);
    expect(result).toEqual({
      kind: "redirect",
      to: "/login?callbackUrl=%2Fsales%2Fnew",
    });
  });

  it("preserves the search string in the callbackUrl", () => {
    const result = decideMiddlewareAction("/sales", "?status=PAID", false);
    expect(result).toEqual({
      kind: "redirect",
      to: "/login?callbackUrl=%2Fsales%3Fstatus%3DPAID",
    });
  });

  it("allows an authenticated user through to any other route", () => {
    expect(decideMiddlewareAction("/sales/new", "", true)).toEqual({
      kind: "next",
    });
  });
});
