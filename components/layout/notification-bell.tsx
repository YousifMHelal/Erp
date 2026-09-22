"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NotificationBellProps } from "@/types";

export function NotificationBell({ unreadCount }: NotificationBellProps) {
  const t = useTranslations("layout");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("notificationsLabel")}
          className="relative min-h-11 min-w-11"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span
              className="absolute end-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white"
              aria-hidden="true"
            >
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>{t("notificationsLabel")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <p className="px-2 py-6 text-center text-body-sm text-muted-foreground">
          {unreadCount > 0 ? t("unreadNotifications", { count: unreadCount }) : t("noNotifications")}
        </p>
        <DropdownMenuSeparator />
        <Link
          href="/notifications"
          className="block px-2 py-1.5 text-center text-body-sm font-medium text-primary hover:underline"
        >
          {t("notificationsLabel")}
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
