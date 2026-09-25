"use client";

import { useTranslations } from "next-intl";
import { PageTransition } from "@/components/layout/page-transition";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { OfflineProvider } from "@/components/pwa/offline-provider";
import type { AppShellProps } from "@/types";

export function AppShell({ children, unreadNotificationCount, currentUser }: AppShellProps) {
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
        <Topbar unreadNotificationCount={unreadNotificationCount} currentUser={currentUser} />
        <OfflineBanner />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 outline-none md:px-6"
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <OfflineProvider userId={currentUser?.id} />
    </div>
  );
}
