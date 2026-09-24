import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { authorizeCredentials } from "@/lib/auth-credentials";

describe("authorizeCredentials against real seeded users", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("accepts the correct username + password for a seeded user", async () => {
    const result = await authorizeCredentials({
      username: "admin",
      password: "Passw0rd!",
    });
    expect(result).not.toBeNull();
    expect(result?.displayName).toBeTruthy();
    expect(result?.permissions).toContain("sale.create");
  });

  it("rejects a wrong password", async () => {
    const result = await authorizeCredentials({
      username: "admin",
      password: "WrongPassword1!",
    });
    expect(result).toBeNull();
  });

  it("rejects an unknown username", async () => {
    const result = await authorizeCredentials({
      username: "no-such-user",
      password: "Passw0rd!",
    });
    expect(result).toBeNull();
  });

  it("rejects malformed credentials (fails loginSchema)", async () => {
    const result = await authorizeCredentials({ password: "" });
    expect(result).toBeNull();
  });

  it("rejects both username and userId given together", async () => {
    const result = await authorizeCredentials({
      username: "admin",
      userId: "whatever",
      password: "Passw0rd!",
    });
    expect(result).toBeNull();
  });

  it("accepts userId login (tile mode) since loginMode is seeded as 'tiles'", async () => {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { username: "admin" },
    });
    const result = await authorizeCredentials({
      userId: admin.id,
      password: "Passw0rd!",
    });
    expect(result).not.toBeNull();
    expect(result?.id).toBe(admin.id);
  });

  it("rejects userId login when loginMode is 'username'", async () => {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { username: "admin" },
    });
    await prisma.setting.update({
      where: { key: "loginMode" },
      data: { value: "username" },
    });
    try {
      const result = await authorizeCredentials({
        userId: admin.id,
        password: "Passw0rd!",
      });
      expect(result).toBeNull();
    } finally {
      await prisma.setting.update({
        where: { key: "loginMode" },
        data: { value: "tiles" },
      });
    }
  });

  it("updates lastLoginAt and writes an auth.login audit row on success", async () => {
    const before = await prisma.user.findUniqueOrThrow({
      where: { username: "cashier2" },
    });
    const result = await authorizeCredentials({
      username: "cashier2",
      password: "Passw0rd!",
    });
    expect(result).not.toBeNull();
    const after = await prisma.user.findUniqueOrThrow({
      where: { username: "cashier2" },
    });
    expect(
      after.lastLoginAt && (!before.lastLoginAt || after.lastLoginAt > before.lastLoginAt),
    ).toBe(true);
    const audit = await prisma.auditLog.findFirst({
      where: { userId: before.id, action: "auth.login" },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).not.toBeNull();
  });

  it("rejects login for a deactivated user", async () => {
    const cashier1 = await prisma.user.findUniqueOrThrow({
      where: { username: "cashier1" },
    });
    const deactivated = await prisma.user.create({
      data: {
        username: `test-inactive-${Date.now()}`,
        displayName: "Test Inactive User",
        passwordHash: cashier1.passwordHash,
        avatarColor: "#000000",
        roleId: cashier1.roleId,
        isActive: false,
      },
    });
    try {
      const result = await authorizeCredentials({
        username: deactivated.username,
        password: "Passw0rd!",
      });
      expect(result).toBeNull();
    } finally {
      await prisma.user.delete({ where: { id: deactivated.id } });
    }
  });
});
