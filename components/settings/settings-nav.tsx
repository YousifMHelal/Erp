"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/settings", labelKey: "settings.nav.profile" },
  { href: "/settings/users", labelKey: "settings.nav.users" },
  { href: "/settings/roles", labelKey: "settings.nav.roles" },
  { href: "/settings/categories", labelKey: "settings.nav.categories" },
  { href: "/settings/cashboxes", labelKey: "settings.nav.cashboxes" },
];

export function SettingsNav() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border pb-px">
      {ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 border-b-2 border-transparent px-3 py-2 text-body-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground",
              isActive && "border-primary text-foreground",
            )}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
