import {
  LayoutDashboard,
  ShoppingCart,
  Undo2,
  Truck,
  PackageSearch,
  ClipboardList,
  Users,
  Building2,
  Wallet,
  HandCoins,
  BanknoteArrowDown,
  ChartColumnBig,
  Bell,
  History,
  Settings,
} from "lucide-react";
import type { NavGroup } from "@/types";

export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "nav.groups.overview",
    items: [{ labelKey: "nav.dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    labelKey: "nav.groups.sales",
    items: [
      { labelKey: "nav.sales", href: "/sales", icon: ShoppingCart },
      { labelKey: "nav.salesReturns", href: "/sales-returns", icon: Undo2 },
    ],
  },
  {
    labelKey: "nav.groups.purchases",
    items: [
      { labelKey: "nav.purchases", href: "/purchases", icon: Truck },
      { labelKey: "nav.purchaseReturns", href: "/purchase-returns", icon: Undo2 },
    ],
  },
  {
    labelKey: "nav.groups.inventory",
    items: [
      { labelKey: "nav.inventory", href: "/inventory", icon: PackageSearch },
      { labelKey: "nav.stocktake", href: "/inventory/stocktake", icon: ClipboardList },
    ],
  },
  {
    labelKey: "nav.groups.parties",
    items: [
      { labelKey: "nav.customers", href: "/customers", icon: Users },
      { labelKey: "nav.suppliers", href: "/suppliers", icon: Building2 },
    ],
  },
  {
    labelKey: "nav.groups.cashboxes",
    items: [
      { labelKey: "nav.cashboxes", href: "/cashboxes", icon: Wallet },
      { labelKey: "nav.collections", href: "/collections", icon: HandCoins },
      { labelKey: "nav.payments", href: "/payments", icon: BanknoteArrowDown },
    ],
  },
  {
    labelKey: "nav.groups.reports",
    items: [{ labelKey: "nav.reports", href: "/reports", icon: ChartColumnBig }],
  },
  {
    labelKey: "nav.groups.admin",
    items: [
      { labelKey: "nav.notifications", href: "/notifications", icon: Bell },
      { labelKey: "nav.auditLog", href: "/audit-log", icon: History },
      { labelKey: "nav.settings", href: "/settings", icon: Settings },
    ],
  },
];
