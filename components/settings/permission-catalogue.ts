import type { PermissionGroup } from "@/types";

// Static preview catalogue for the P2-20 UI. lib/permissions.ts (P4-1) is the
// real, single-source catalogue that actions and middleware check against.
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "sale",
    labelKey: "settings.roles.groups.sale",
    actions: [
      { key: "sale.view", labelKey: "settings.roles.actions.view" },
      { key: "sale.create", labelKey: "settings.roles.actions.create" },
      { key: "sale.edit", labelKey: "settings.roles.actions.edit" },
      { key: "sale.cancel", labelKey: "settings.roles.actions.cancel" },
      { key: "sale.print", labelKey: "settings.roles.actions.print" },
    ],
  },
  {
    key: "purchase",
    labelKey: "settings.roles.groups.purchase",
    actions: [
      { key: "purchase.view", labelKey: "settings.roles.actions.view" },
      { key: "purchase.create", labelKey: "settings.roles.actions.create" },
      { key: "purchase.edit", labelKey: "settings.roles.actions.edit" },
      { key: "purchase.cancel", labelKey: "settings.roles.actions.cancel" },
    ],
  },
  {
    key: "return",
    labelKey: "settings.roles.groups.return",
    actions: [
      { key: "return.view", labelKey: "settings.roles.actions.view" },
      { key: "return.create", labelKey: "settings.roles.actions.create" },
    ],
  },
  {
    key: "inventory",
    labelKey: "settings.roles.groups.inventory",
    actions: [
      { key: "inventory.view", labelKey: "settings.roles.actions.view" },
      { key: "inventory.create", labelKey: "settings.roles.actions.create" },
      { key: "inventory.edit", labelKey: "settings.roles.actions.edit" },
      { key: "inventory.adjustPrice", labelKey: "settings.roles.actions.adjustPrice" },
      { key: "inventory.stocktake", labelKey: "settings.roles.actions.stocktake" },
    ],
  },
  {
    key: "customer",
    labelKey: "settings.roles.groups.customer",
    actions: [
      { key: "customer.view", labelKey: "settings.roles.actions.view" },
      { key: "customer.create", labelKey: "settings.roles.actions.create" },
      { key: "customer.edit", labelKey: "settings.roles.actions.edit" },
    ],
  },
  {
    key: "supplier",
    labelKey: "settings.roles.groups.supplier",
    actions: [
      { key: "supplier.view", labelKey: "settings.roles.actions.view" },
      { key: "supplier.create", labelKey: "settings.roles.actions.create" },
      { key: "supplier.edit", labelKey: "settings.roles.actions.edit" },
    ],
  },
  {
    key: "cashbox",
    labelKey: "settings.roles.groups.cashbox",
    actions: [
      { key: "cashbox.view", labelKey: "settings.roles.actions.view" },
      { key: "cashbox.manage", labelKey: "settings.roles.actions.manage" },
    ],
  },
  {
    key: "collection",
    labelKey: "settings.roles.groups.collection",
    actions: [
      { key: "collection.view", labelKey: "settings.roles.actions.view" },
      { key: "collection.create", labelKey: "settings.roles.actions.create" },
    ],
  },
  {
    key: "payment",
    labelKey: "settings.roles.groups.payment",
    actions: [
      { key: "payment.view", labelKey: "settings.roles.actions.view" },
      { key: "payment.create", labelKey: "settings.roles.actions.create" },
    ],
  },
  {
    key: "report",
    labelKey: "settings.roles.groups.report",
    actions: [
      { key: "report.view", labelKey: "settings.roles.actions.view" },
      { key: "report.profitLoss", labelKey: "settings.roles.actions.profitLoss" },
      { key: "report.export", labelKey: "settings.roles.actions.export" },
    ],
  },
  {
    key: "user",
    labelKey: "settings.roles.groups.user",
    actions: [
      { key: "user.view", labelKey: "settings.roles.actions.view" },
      { key: "user.manage", labelKey: "settings.roles.actions.manage" },
    ],
  },
  {
    key: "role",
    labelKey: "settings.roles.groups.role",
    actions: [{ key: "role.manage", labelKey: "settings.roles.actions.manage" }],
  },
  {
    key: "audit",
    labelKey: "settings.roles.groups.audit",
    actions: [{ key: "audit.view", labelKey: "settings.roles.actions.view" }],
  },
  {
    key: "settings",
    labelKey: "settings.roles.groups.settings",
    actions: [{ key: "settings.manage", labelKey: "settings.roles.actions.manage" }],
  },
];
