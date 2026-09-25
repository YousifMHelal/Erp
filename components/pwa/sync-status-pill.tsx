"use client";

import { useState } from "react";
import { AlertTriangle, CloudUpload, Loader2, WifiOff, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { OutboxSheet } from "@/components/pwa/outbox-sheet";
import { cn } from "@/lib/utils";
import { useOfflineStore } from "@/stores/offline.store";

const toneStyles = {
  warning: "bg-warning-bg text-warning-fg",
  danger: "bg-danger-bg text-danger-fg",
  info: "bg-info-bg text-info-fg",
} as const;

/**
 * Topbar indicator for offline mode. Renders nothing while online with an empty outbox, so
 * the everyday screen is unchanged; appears only when offline or when documents await sync.
 */
export function SyncStatusPill() {
  const t = useTranslations("offline");
  const online = useOfflineStore((state) => state.online);
  const items = useOfflineStore((state) => state.items);
  const syncingHere = useOfflineStore((state) => state.syncing);
  const [open, setOpen] = useState(false);

  const failed = items.filter((item) => item.status === "failed").length;
  const pending = items.length - failed;
  const busy = syncingHere || items.some((item) => item.status === "syncing");

  let pill: { tone: keyof typeof toneStyles; icon: LucideIcon; label: string; count?: number; spin?: boolean } | null =
    null;
  if (!online) pill = { tone: "warning", icon: WifiOff, label: t("statusOffline"), count: items.length || undefined };
  else if (failed > 0) pill = { tone: "danger", icon: AlertTriangle, label: t("statusFailed", { count: failed }) };
  else if (pending > 0) {
    pill = { tone: "info", icon: busy ? Loader2 : CloudUpload, label: t("statusPending", { count: pending }), spin: busy };
  }

  return (
    <>
      {pill && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={pill.count ? `${pill.label} — ${t("statusPending", { count: pill.count })}` : pill.label}
          aria-haspopup="dialog"
          className={cn(
            "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 text-label font-medium whitespace-nowrap transition-shadow duration-200 hover:shadow-elevation-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:shadow-none",
            toneStyles[pill.tone],
          )}
        >
          <pill.icon className={cn("size-4 shrink-0", pill.spin && "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
          <span className="hidden sm:inline">{pill.label}</span>
          {pill.count !== undefined && (
            <span className="rounded-sm bg-background/60 px-1.5 text-caption tabular-nums" aria-hidden="true">
              {pill.count}
            </span>
          )}
        </button>
      )}
      <OutboxSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
