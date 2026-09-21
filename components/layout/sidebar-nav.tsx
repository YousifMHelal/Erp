"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/lib/nav";
import type { SidebarNavProps } from "@/types";

function findActiveHref(pathname: string): string | undefined {
  const allItems = NAV_GROUPS.flatMap((g) => g.items);
  const matches = allItems.filter(
    (item) => item.href === pathname || (item.href !== "/" && pathname.startsWith(`${item.href}/`)),
  );
  if (matches.length === 0) return undefined;
  return matches.reduce((longest, item) => (item.href.length > longest.href.length ? item : longest)).href;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const activeHref = findActiveHref(pathname);

  return (
    <nav className="flex flex-col gap-6 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.labelKey} className="flex flex-col gap-1">
          <span className="px-3 text-caption font-medium text-sidebar-foreground/60 group-data-[expanded=false]/sidebar:sr-only">
            {t(group.labelKey)}
          </span>
          {group.items.map((item) => {
            const isActive = item.href === activeHref;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                title={t(item.labelKey)}
                className={cn(
                  "relative flex min-h-11 items-center gap-3 rounded-md px-3 text-body-sm font-medium text-sidebar-foreground transition-colors duration-200",
                  "hover:bg-sidebar-accent/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  isActive && "bg-sidebar-accent text-white",
                )}
              >
                {isActive && (
                  <span className="absolute inset-y-1 start-0 w-[3px] rounded-full bg-accent" aria-hidden="true" />
                )}
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="truncate group-data-[expanded=false]/sidebar:sr-only">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
