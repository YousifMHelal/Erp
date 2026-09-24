import { describe, expect, it } from "vitest";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";
import { jwtCallback, sessionCallback } from "@/lib/auth-credentials";

describe("jwtCallback", () => {
  it("copies user fields onto the token on initial sign-in", () => {
    const token = {} as JWT;
    const user = {
      id: "u1",
      displayName: "Ahmed",
      roleId: "r1",
      permissions: ["sale.view"],
    } as User;
    const result = jwtCallback({ token, user });
    expect(result.userId).toBe("u1");
    expect(result.displayName).toBe("Ahmed");
    expect(result.roleId).toBe("r1");
    expect(result.permissions).toEqual(["sale.view"]);
  });

  it("leaves an existing token unchanged on subsequent requests (no user passed)", () => {
    const token = {
      userId: "u1",
      displayName: "Ahmed",
      roleId: "r1",
      permissions: ["sale.view"],
    } as JWT;
    const result = jwtCallback({ token });
    expect(result).toBe(token);
  });

  it("defaults userId to an empty string when the user has no id", () => {
    const token = {} as JWT;
    const user = { displayName: "X", roleId: "r1", permissions: [] } as User;
    const result = jwtCallback({ token, user });
    expect(result.userId).toBe("");
  });
});

describe("sessionCallback", () => {
  it("copies token fields onto session.user", () => {
    const session = { user: {} } as Session;
    const token = {
      userId: "u1",
      displayName: "Ahmed",
      roleId: "r1",
      permissions: ["sale.view", "sale.create"],
    } as JWT;
    const result = sessionCallback({ session, token });
    expect(result.user.id).toBe("u1");
    expect(result.user.displayName).toBe("Ahmed");
    expect(result.user.roleId).toBe("r1");
    expect(result.user.permissions).toEqual(["sale.view", "sale.create"]);
  });
});
