import { NAV_GROUPS } from "@/lib/nav";
import type { BreadcrumbItem } from "@/types";

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === "/") {
    return [{ labelKey: "nav.dashboard" }];
  }

  const allItems = NAV_GROUPS.flatMap((g) => g.items);
  const match = allItems.find((item) => item.href !== "/" && pathname.startsWith(item.href));

  if (!match) return [];

  return [{ labelKey: match.labelKey }];
}
