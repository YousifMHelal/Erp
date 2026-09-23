"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { useScrolled } from "@/hooks/use-scrolled";
import { cn } from "@/lib/utils";
import { getBreadcrumbs } from "@/lib/breadcrumbs";
import type { TopbarProps } from "@/types";

export function Topbar({ className, unreadNotificationCount }: TopbarProps) {
  const pathname = usePathname();
  const items = getBreadcrumbs(pathname);
  const scrolled = useScrolled();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-15 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm transition-shadow duration-200 md:px-6",
        scrolled && "shadow-elevation-sm",
        className,
      )}
    >
      <MobileNav />
      <Breadcrumb items={items} />
      <div className="ms-auto flex items-center gap-1.5">
        <GlobalSearch />
        <NotificationBell unreadCount={unreadNotificationCount} />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
