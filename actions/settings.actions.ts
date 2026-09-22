"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { fail, ok } from "@/lib/action-result";
import { writeAudit } from "@/lib/audit";
import { AuthRequiredError, PermissionDeniedError, requirePermission } from "@/lib/auth-guard";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  categorySchema, partyIdSchema, printPreferencesSchema, roleSchema,
  settingsCashboxSchema, settingsUserSchema, shopProfileSchema,
} from "@/lib/validations";
import messages from "@/messages/ar.json";
import type {
  ActionResult, CategoryRow, RoleRow, SettingsCashboxRow, SettingsOverview,
  SettingsUserRow, SettingsUsersData,
} from "@/types";

const m = messages.settingsAction;

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(m.unauthorized);
  if (error instanceof PermissionDeniedError) return fail(m.forbidden);
  console.error("Settings action failed", error);
  return fail(m.failed);
}

export async function getSettingsOverview(): Promise<ActionResult<SettingsOverview>> {
  try {
    await requirePermission("settings.manage");
    const [settings, cashboxes] = await Promise.all([
      prisma.setting.findMany({ where: { key: { in: ["shop.name", "shop.phone", "shop.address", "shop.taxNote", "shop.invoiceFooter", "print.defaultSize", "print.defaultCashboxId"] } } }),
      prisma.cashbox.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    ]);
    const values = new Map(settings.map((setting) => [setting.key, String(setting.value)]));
    const firstCashbox = cashboxes[0]?.id ?? "";
    return ok({
      profile: { name: values.get("shop.name") ?? "", phone: values.get("shop.phone") ?? "", address: values.get("shop.address") ?? "", taxNote: values.get("shop.taxNote"), invoiceFooter: values.get("shop.invoiceFooter") },
      printPreferences: { defaultPrintSize: (values.get("print.defaultSize") as "A4" | "A5" | "80mm") ?? "A4", defaultCashboxId: values.get("print.defaultCashboxId") ?? firstCashbox },
      cashboxes: cashboxes.map((cashbox) => ({ value: cashbox.id, label: cashbox.name })),
    });
  } catch (error) { return actionError(error); }
}

export async function saveShopProfile(input: unknown): Promise<ActionResult<null>> {
  try {
    const user = await requirePermission("settings.manage");
    const parsed = shopProfileSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);
    await prisma.$transaction(async (tx) => {
      for (const [key, value] of Object.entries(parsed.data)) await tx.setting.upsert({ where: { key: `shop.${key}` }, create: { key: `shop.${key}`, value: value ?? "" }, update: { value: value ?? "" } });
      await writeAudit(tx, { userId: user.id, action: "settings.profile.update", entityType: "Setting", entityId: "shop", entityLabel: parsed.data.name, after: parsed.data });
    });
    revalidatePath("/settings"); return ok(null);
  } catch (error) { return actionError(error); }
}

export async function savePrintPreferences(input: unknown): Promise<ActionResult<null>> {
  try {
    const user = await requirePermission("settings.manage");
    const parsed = printPreferencesSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);
    await prisma.$transaction(async (tx) => {
      await tx.cashbox.findUniqueOrThrow({ where: { id: parsed.data.defaultCashboxId } });
      await Promise.all([
        tx.setting.upsert({ where: { key: "print.defaultSize" }, create: { key: "print.defaultSize", value: parsed.data.defaultPrintSize }, update: { value: parsed.data.defaultPrintSize } }),
        tx.setting.upsert({ where: { key: "print.defaultCashboxId" }, create: { key: "print.defaultCashboxId", value: parsed.data.defaultCashboxId }, update: { value: parsed.data.defaultCashboxId } }),
      ]);
      await writeAudit(tx, { userId: user.id, action: "settings.print.update", entityType: "Setting", entityId: "print", entityLabel: m.printPreferences, after: parsed.data });
    });
    revalidatePath("/settings"); return ok(null);
  } catch (error) { return actionError(error); }
}

export async function getCategories(): Promise<ActionResult<CategoryRow[]>> {
  try {
    await requirePermission("settings.manage");
    const rows = await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: "asc" } });
    return ok(rows.map((row) => ({ id: row.id, name: row.name, description: row.description ?? undefined, productCount: row._count.products })));
  } catch (error) { return actionError(error); }
}

export async function saveCategory(id: string | undefined, input: unknown): Promise<ActionResult<CategoryRow>> {
  try {
    const user = await requirePermission("settings.manage");
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const row = await prisma.$transaction(async (tx) => {
      const category = id ? await tx.category.update({ where: { id }, data: parsed.data }) : await tx.category.create({ data: parsed.data });
      await writeAudit(tx, { userId: user.id, action: id ? "category.update" : "category.create", entityType: "Category", entityId: category.id, entityLabel: category.name, after: parsed.data });
      return category;
    });
    revalidatePath("/settings/categories"); return ok({ ...row, description: row.description ?? undefined, productCount: id ? await prisma.product.count({ where: { categoryId: id } }) : 0 });
  } catch (error) { return actionError(error); }
}

export async function deleteCategory(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("settings.manage");
    const parsed = partyIdSchema.safeParse(id); if (!parsed.success) return fail(m.invalid);
    await prisma.$transaction(async (tx) => {
      const before = await tx.category.findUniqueOrThrow({ where: { id: parsed.data }, include: { _count: { select: { products: true } } } });
      if (before._count.products > 0) throw new Error("CATEGORY_IN_USE");
      await tx.category.delete({ where: { id: before.id } });
      await writeAudit(tx, { userId: user.id, action: "category.delete", entityType: "Category", entityId: before.id, entityLabel: before.name, before: { name: before.name } });
    });
    revalidatePath("/settings/categories"); return ok({ id: parsed.data });
  } catch (error) { return actionError(error); }
}

export async function getSettingsCashboxes(): Promise<ActionResult<SettingsCashboxRow[]>> {
  try {
    await requirePermission("settings.manage");
    const rows = await prisma.cashbox.findMany({ orderBy: { sortOrder: "asc" } });
    return ok(rows.map((row) => ({ id: row.id, name: row.name, description: row.description ?? undefined, isActive: row.isActive, sortOrder: row.sortOrder })));
  } catch (error) { return actionError(error); }
}

export async function saveSettingsCashbox(id: string | undefined, input: unknown): Promise<ActionResult<SettingsCashboxRow>> {
  try {
    const user = await requirePermission("settings.manage");
    const parsed = settingsCashboxSchema.safeParse(input); if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const row = await prisma.$transaction(async (tx) => {
      const cashbox = id ? await tx.cashbox.update({ where: { id }, data: parsed.data }) : await tx.cashbox.create({ data: { ...parsed.data, openingBalance: 0, balance: 0, sortOrder: await tx.cashbox.count() } });
      await writeAudit(tx, { userId: user.id, action: id ? "cashbox.update" : "cashbox.create", entityType: "Cashbox", entityId: cashbox.id, entityLabel: cashbox.name, after: parsed.data }); return cashbox;
    });
    revalidatePath("/settings/cashboxes"); return ok({ ...row, description: row.description ?? undefined });
  } catch (error) { return actionError(error); }
}

export async function deleteSettingsCashbox(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("settings.manage"); const parsed = partyIdSchema.safeParse(id); if (!parsed.success) return fail(m.invalid);
    await prisma.$transaction(async (tx) => {
      const before = await tx.cashbox.findUniqueOrThrow({ where: { id: parsed.data }, include: { _count: { select: { cashMovements: true, invoices: true, collections: true, payments: true } } } });
      if (Object.values(before._count).some((count) => count > 0) || !before.balance.isZero()) throw new Error("CASHBOX_IN_USE");
      await tx.cashbox.delete({ where: { id: before.id } });
      await writeAudit(tx, { userId: user.id, action: "cashbox.delete", entityType: "Cashbox", entityId: before.id, entityLabel: before.name, before: { name: before.name } });
    });
    revalidatePath("/settings/cashboxes"); return ok({ id: parsed.data });
  } catch (error) { return actionError(error); }
}

export async function getSettingsUsers(): Promise<ActionResult<SettingsUsersData>> {
  try {
    await requirePermission("user.view");
    const [users, roles] = await Promise.all([prisma.user.findMany({ include: { role: true }, orderBy: { displayName: "asc" } }), prisma.role.findMany({ orderBy: { name: "asc" } })]);
    return ok({ users: users.map((user) => ({ id: user.id, displayName: user.displayName, username: user.username, roleName: user.role.name, isActive: user.isActive, lastLoginAt: user.lastLoginAt?.toISOString() })), roles: roles.map((role) => ({ value: role.id, label: role.name })) });
  } catch (error) { return actionError(error); }
}

export async function saveSettingsUser(id: string | undefined, input: unknown): Promise<ActionResult<SettingsUserRow>> {
  try {
    const actor = await requirePermission(id ? "user.edit" : "user.create"); const parsed = settingsUserSchema.safeParse(input);
    if (!parsed.success || (!id && !parsed.data?.password)) return fail(m.invalid, parsed.success ? undefined : parsed.error.flatten().fieldErrors);
    const passwordHash = parsed.data.password ? await bcrypt.hash(parsed.data.password, 12) : undefined;
    const user = await prisma.$transaction(async (tx) => {
      const saved = id ? await tx.user.update({ where: { id }, data: { displayName: parsed.data.displayName, username: parsed.data.username, roleId: parsed.data.roleId, isActive: parsed.data.isActive, passwordHash } }) : await tx.user.create({ data: { displayName: parsed.data.displayName, username: parsed.data.username, roleId: parsed.data.roleId, isActive: parsed.data.isActive, passwordHash: passwordHash! , avatarColor: "primary" } });
      await writeAudit(tx, { userId: actor.id, action: id ? "user.update" : "user.create", entityType: "User", entityId: saved.id, entityLabel: saved.displayName, after: { username: saved.username, roleId: saved.roleId, isActive: saved.isActive } }); return saved;
    });
    const role = await prisma.role.findUniqueOrThrow({ where: { id: user.roleId } }); revalidatePath("/settings/users");
    return ok({ id: user.id, displayName: user.displayName, username: user.username, roleName: role.name, isActive: user.isActive, lastLoginAt: user.lastLoginAt?.toISOString() });
  } catch (error) { return actionError(error); }
}

export async function deactivateUser(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requirePermission("user.edit"); const parsed = partyIdSchema.safeParse(id); if (!parsed.success || parsed.data === actor.id) return fail(m.invalid);
    await prisma.$transaction(async (tx) => { const before = await tx.user.update({ where: { id: parsed.data }, data: { isActive: false } }); await writeAudit(tx, { userId: actor.id, action: "user.deactivate", entityType: "User", entityId: before.id, entityLabel: before.displayName, after: { isActive: false } }); });
    revalidatePath("/settings/users"); return ok({ id: parsed.data });
  } catch (error) { return actionError(error); }
}

export async function getRoles(): Promise<ActionResult<RoleRow[]>> {
  try {
    await requirePermission("role.view"); const roles = await prisma.role.findMany({ include: { _count: { select: { users: true } } }, orderBy: { name: "asc" } });
    return ok(roles.map((role) => ({ id: role.id, name: role.name, description: role.description ?? undefined, isSystem: role.isSystem, userCount: role._count.users, permissions: role.permissions })));
  } catch (error) { return actionError(error); }
}

export async function saveRole(id: string | undefined, input: unknown): Promise<ActionResult<RoleRow>> {
  try {
    const actor = await requirePermission(id ? "role.edit" : "role.create"); const parsed = roleSchema.safeParse(input); if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);
    if (parsed.data.permissions.some((permission) => !ALL_PERMISSIONS.includes(permission))) return fail(m.invalid);
    if (id) {
      const current = await prisma.role.findUnique({ where: { id } });
      if (current?.isSystem) return fail(m.failed);
    }
    const role = await prisma.$transaction(async (tx) => {
      const saved = id ? await tx.role.update({ where: { id }, data: parsed.data }) : await tx.role.create({ data: { ...parsed.data, isSystem: false } });
      await writeAudit(tx, { userId: actor.id, action: id ? "role.update" : "role.create", entityType: "Role", entityId: saved.id, entityLabel: saved.name, after: parsed.data }); return saved;
    });
    const count = await prisma.user.count({ where: { roleId: role.id } }); revalidatePath("/settings/roles"); return ok({ id: role.id, name: role.name, description: role.description ?? undefined, isSystem: role.isSystem, userCount: count, permissions: role.permissions });
  } catch (error) { return actionError(error); }
}
