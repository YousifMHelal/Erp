"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { enqueueOperation, newRequestId } from "@/lib/offline/outbox";
import { trackSave } from "@/lib/offline/save-state";
import { useOfflineStore } from "@/stores/offline.store";
import type { OfflineAwareSaveOutcome, OfflineAwareSaveRequest, OutboxOperation } from "@/types";

/** redirect() / notFound() travel as thrown errors — they must keep reaching the router. */
function isRouterSignal(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) return false;
  const { digest } = error;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK"));
}

/**
 * Create-document save shared by the sale, purchase and money-document forms.
 * Online it calls the server exactly as before (plus an idempotency id) and hands back the
 * server's answer. Only when there is no connection — or the call fails in transit — it
 * keeps the document in the device outbox, toasts, and reports `queued`.
 */
export function useOfflineAwareSave() {
  const t = useTranslations("offline");

  return useCallback(
    async <P extends OutboxOperation["payload"]>(request: OfflineAwareSaveRequest<P>): Promise<OfflineAwareSaveOutcome> => {
      const clientRequestId = newRequestId();
      if (navigator.onLine) {
        try {
          const result = await trackSave(() => request.submit({ ...request.payload, clientRequestId }));
          return { mode: "online", result };
        } catch (error) {
          if (isRouterSignal(error)) throw error;
          // Transport failure: the same id is reused, so if the server did commit, the sync gets the original back.
        }
      }

      const { userId, snapshot, available } = useOfflineStore.getState();
      if (!userId || !available) {
        toast.error(t("storageUnavailable"));
        return { mode: "blocked" };
      }
      if (snapshot && !snapshot.permissions[request.kind]) {
        toast.error(t("noPermission"));
        return { mode: "blocked" };
      }
      try {
        // The kind/payload pairing is fixed by each form's call site.
        const operation = { kind: request.kind, payload: request.payload } as OutboxOperation;
        await enqueueOperation({ operation, clientRequestId, userId, partyName: request.partyName });
      } catch {
        toast.error(t("storageUnavailable"));
        return { mode: "blocked" };
      }
      toast.success(t("savedOffline"));
      return { mode: "queued" };
    },
    [t],
  );
}
