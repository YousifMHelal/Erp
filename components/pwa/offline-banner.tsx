"use client";

import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOfflineStore } from "@/stores/offline.store";

/** Slim notice above the page content — rendered only while the device has no connection. */
export function OfflineBanner() {
  const t = useTranslations("offline");
  const online = useOfflineStore((state) => state.online);
  const available = useOfflineStore((state) => state.available);
  if (online) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-2 border-b border-border bg-warning-bg px-4 py-2 text-body-sm text-warning-fg md:px-6"
    >
      <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{available ? t("banner") : t("bannerUnavailable")}</p>
    </div>
  );
}
