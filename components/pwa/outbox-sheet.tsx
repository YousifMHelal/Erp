"use client";

import { useState } from "react";
import { CloudUpload, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { OutboxItemCard } from "@/components/pwa/outbox-item-card";
import { useMediaQuery } from "@/hooks/use-media-query";
import { discardOutboxItem, retryOutboxItem } from "@/lib/offline/outbox";
import { cn } from "@/lib/utils";
import { useOfflineStore } from "@/stores/offline.store";
import type { OutboxItem, OutboxSheetProps } from "@/types";

/** Lists this device's queued documents with retry (failed only) and discard. */
export function OutboxSheet({ open, onOpenChange }: OutboxSheetProps) {
  const t = useTranslations("offline.sheet");
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const items = useOfflineStore((state) => state.items);
  const online = useOfflineStore((state) => state.online);
  const syncing = useOfflineStore((state) => state.syncing);
  const otherUsersPending = useOfflineStore((state) => state.otherUsersPending);
  const requestSync = useOfflineStore((state) => state.requestSync);
  const [discarding, setDiscarding] = useState<OutboxItem | null>(null);

  const sendable = items.some((item) => item.status === "pending");

  async function retry(item: OutboxItem) {
    try {
      await retryOutboxItem(item.clientRequestId);
    } catch {
      return;
    }
    requestSync();
  }

  async function confirmDiscard() {
    if (!discarding) return;
    try {
      await discardOutboxItem(discarding.clientRequestId);
    } catch {
      // Storage unavailable — the item stays listed.
    } finally {
      setDiscarding(null);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={isDesktop ? "left" : "bottom"}
          className={cn("flex flex-col gap-0 p-0", isDesktop ? "w-full sm:max-w-md" : "max-h-[85dvh] rounded-t-lg")}
        >
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle>{t("title")}</SheetTitle>
            <SheetDescription>{t("description")}</SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
            {otherUsersPending > 0 && (
              <p className="rounded-md bg-warning-bg px-3 py-2 text-body-sm text-warning-fg">
                {t("otherUsersPending", { count: otherUsersPending })}
              </p>
            )}
            {!online && items.length > 0 && <p className="text-body-sm text-muted-foreground">{t("offlineHint")}</p>}
            {items.length === 0 ? (
              <EmptyState icon={<CloudUpload className="size-6" aria-hidden="true" />} title={t("empty")} />
            ) : (
              <ul aria-label={t("listLabel")} className="flex flex-col gap-2">
                {items.map((item) => (
                  <li key={item.clientRequestId}>
                    <OutboxItemCard item={item} onRetry={(entry) => void retry(entry)} onDiscard={setDiscarding} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <SheetFooter className="border-t border-border p-4">
            <Button
              type="button"
              variant="accent"
              size="lg"
              className="min-h-11 w-full"
              disabled={!online || syncing || !sendable}
              onClick={requestSync}
            >
              <RefreshCw className={cn(syncing && "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
              {t("syncNow")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        open={discarding !== null}
        onOpenChange={(next) => !next && setDiscarding(null)}
        title={t("discardTitle")}
        description={t("discardDescription")}
        confirmLabel={t("discard")}
        variant="destructive"
        onConfirm={() => void confirmDiscard()}
      />
    </>
  );
}
