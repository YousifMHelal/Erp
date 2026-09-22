import type { PermissionGroup, PermissionGroupKey } from "@/types";

const actionsByGroup: Record<PermissionGroupKey, string[]> = {
  sale: ["view", "create", "edit", "cancel", "print"],
  purchase: ["view", "create", "edit", "cancel", "print"],
  return: ["view", "create", "cancel"],
  inventory: ["view", "create", "edit", "adjustPrice", "stocktake"],
  customer: ["view", "create", "edit"],
  supplier: ["view", "create", "edit"],
  cashbox: ["view", "create", "edit", "transfer"],
  collection: ["view", "create", "cancel"],
  payment: ["view", "create", "cancel"],
  report: ["view", "profitLoss", "export"],
  user: ["view", "create", "edit"],
  role: ["view", "create", "edit"],
  audit: ["view"],
  settings: ["manage"],
};

export const PERMISSION_GROUPS: PermissionGroup[] = (
  Object.entries(actionsByGroup) as [PermissionGroupKey, string[]][]
).map(([key, actions]) => ({
  key,
  labelKey: `settings.roles.groups.${key}`,
  actions: actions.map((action) => ({
    key: `${key}.${action}`,
    labelKey: `settings.roles.actions.${action}`,
  })),
}));

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) =>
  group.actions.map((action) => action.key),
);
const knownPermissions = new Set(ALL_PERMISSIONS);

export function isPermissionKey(key: string): boolean {
  return knownPermissions.has(key);
}

export function hasPermission(
  granted: readonly string[],
  key: string,
): boolean {
  return isPermissionKey(key) && granted.includes(key);
}
