"use client";

import { useTranslations } from "next-intl";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { AppShellProps } from "@/types";

export function AppShell({ children, unreadNotificationCount }: AppShellProps) {
  const t = useTranslations("layout");

  return (
    <div className="flex min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50"
      >
        {t("skipToContent")}
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar unreadNotificationCount={unreadNotificationCount} />
        <main id="main-content" className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
