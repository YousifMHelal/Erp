import { NAV_GROUPS } from "@/lib/nav";
import type { BreadcrumbItem } from "@/types";

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === "/") {
    return [{ labelKey: "nav.dashboard" }];
  }

  const allItems = NAV_GROUPS.flatMap((g) => g.items);
  const matches = allItems.filter(
    (item) => item.href !== "/" && (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );

  if (matches.length === 0) return [];

  const match = matches.reduce((longest, item) => (item.href.length > longest.href.length ? item : longest));

  return [{ labelKey: match.labelKey }];
}
