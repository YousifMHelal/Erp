import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { mockAuth } from "../setup";

const {
  AuthRequiredError,
  PermissionDeniedError,
  getCurrentUser,
  requirePermission,
} = await import("@/lib/auth-guard");

describe("getCurrentUser / requirePermission against real seeded users", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns null when there is no session", async () => {
    mockAuth.mockResolvedValueOnce(null);
    expect(await getCurrentUser()).toBeNull();
  });

  it("returns null when the session has no user id", async () => {
    mockAuth.mockResolvedValueOnce({ user: {} });
    expect(await getCurrentUser()).toBeNull();
  });

  it("loads the real user + role for a valid, active seeded admin", async () => {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { username: "admin" },
    });
    mockAuth.mockResolvedValueOnce({ user: { id: admin.id } });
    const user = await getCurrentUser();
    expect(user?.username).toBe("admin");
    expect(user?.role.permissions).toContain("sale.create");
  });

  it("requirePermission resolves for a permission the admin's role grants", async () => {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { username: "admin" },
    });
    mockAuth.mockResolvedValueOnce({ user: { id: admin.id } });
    const user = await requirePermission("sale.create");
    expect(user.username).toBe("admin");
  });

  it("requirePermission throws PermissionDeniedError for a permission the cashier's role lacks", async () => {
    const cashier = await prisma.user.findUniqueOrThrow({
      where: { username: "cashier1" },
      include: { role: true },
    });
    expect(cashier.role.permissions).not.toContain("role.create");
    // Roles CRUD is manager-only in the seeded permission catalogue.
    mockAuth.mockResolvedValueOnce({ user: { id: cashier.id } });
    await expect(requirePermission("role.create")).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
  });

  it("requirePermission throws AuthRequiredError when there is no session", async () => {
    mockAuth.mockResolvedValueOnce(null);
    await expect(requirePermission("sale.create")).rejects.toBeInstanceOf(
      AuthRequiredError,
    );
  });

  it("requirePermission throws for an unknown permission key regardless of session", async () => {
    await expect(requirePermission("sale.teleport")).rejects.toThrow(
      "Unknown permission",
    );
  });

  it("getCurrentUser returns null for a deactivated user even with a valid session id", async () => {
    const cashier1 = await prisma.user.findUniqueOrThrow({
      where: { username: "cashier1" },
    });
    const deactivated = await prisma.user.create({
      data: {
        username: `test-inactive-${Date.now()}`,
        displayName: "Test Inactive User",
        passwordHash: "x",
        avatarColor: "#000000",
        roleId: cashier1.roleId,
        isActive: false,
      },
    });
    try {
      mockAuth.mockResolvedValueOnce({ user: { id: deactivated.id } });
      expect(await getCurrentUser()).toBeNull();
    } finally {
      await prisma.user.delete({ where: { id: deactivated.id } });
    }
  });
});
