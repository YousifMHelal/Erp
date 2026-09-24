import { describe, expect, it } from "vitest";
import { ALL_PERMISSIONS, hasPermission, isPermissionKey } from "@/lib/permissions";

describe("isPermissionKey", () => {
  it("accepts a real permission key", () => {
    expect(isPermissionKey("sale.create")).toBe(true);
  });

  it("rejects an unknown key", () => {
    expect(isPermissionKey("sale.teleport")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isPermissionKey("")).toBe(false);
  });

  it("every catalogued permission round-trips as known", () => {
    for (const key of ALL_PERMISSIONS) {
      expect(isPermissionKey(key)).toBe(true);
    }
  });
});

describe("hasPermission", () => {
  it("is true when the key is in the granted list", () => {
    expect(hasPermission(["sale.create", "sale.view"], "sale.create")).toBe(true);
  });

  it("is false when the key is missing from the granted list", () => {
    expect(hasPermission(["sale.view"], "sale.create")).toBe(false);
  });

  it("is false for an unknown permission even if the string happens to be granted", () => {
    expect(hasPermission(["sale.teleport"], "sale.teleport")).toBe(false);
  });

  it("is false against an empty granted list", () => {
    expect(hasPermission([], "sale.view")).toBe(false);
  });
});
