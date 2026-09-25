"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { readLastUserId, writeLastUserId } from "@/lib/offline/db";
import { loadOfflineState, subscribeOfflineChange } from "@/lib/offline/outbox";
import { clearOfflineSession, isOfflineRoute, refreshSnapshot, warmOfflinePages } from "@/lib/offline/snapshot";
import { isSaveInFlight } from "@/lib/offline/save-state";
import { runOutboxSync } from "@/lib/offline/sync";
import { useOfflineStore } from "@/stores/offline.store";
import type { OfflineProviderProps } from "@/types";

const SYNC_INTERVAL_MS = 30_000;
const MAX_BACKOFF_MS = 5 * 60_000;
const SNAPSHOT_INTERVAL_MS = 5 * 60_000;
const WARM_INTERVAL_MS = 30 * 60_000;
/** Background work waits this long after mount, then for an idle moment, so it never competes with the page load. */
const STARTUP_DELAY_MS = 3_000;

function whenIdle(task: () => void): () => void {
  let idleHandle: number | undefined;
  const timeout = window.setTimeout(() => {
    if (typeof window.requestIdleCallback === "function") idleHandle = window.requestIdleCallback(task, { timeout: 5_000 });
    else task();
  }, STARTUP_DELAY_MS);
  return () => {
    window.clearTimeout(timeout);
    if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle);
  };
}

/**
 * Offline mode's engine, mounted once by the dashboard shell. Renders nothing. Keeps the
 * device snapshot fresh, sends the outbox when a connection exists, and keeps soft
 * navigation from dead-ending while offline. Everything here is silent and failure-proof:
 * if IndexedDB or the service worker is unavailable, the app behaves exactly as without it.
 */
export function OfflineProvider({ userId }: OfflineProviderProps) {
  const router = useRouter();
  const t = useTranslations("offline");
  const patch = useOfflineStore((state) => state.patch);
  // Read through a ref so a new translator identity never restarts the timers below.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });

  useEffect(() => {
    patch({ online: navigator.onLine, loadedOffline: !navigator.onLine });
    const update = () => patch({ online: navigator.onLine });
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [patch]);

  // Offline, the App Router can't fetch the next screen. The create screens are served by the
  // service worker on a full page load; every other screen needs the server, so say so and stay.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (navigator.onLine || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      event.stopPropagation();
      if (isOfflineRoute(url.pathname)) window.location.assign(url.href);
      else toast.info(t("onlineOnlyScreen"));
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [t]);

  useEffect(() => {
    if (!userId) return;
    const currentUserId = userId;
    let cancelled = false;
    let syncing = false;
    let transientFailures = 0;
    let backoffUntil = 0;
    let lastWarmAt = 0;

    async function refresh() {
      if (cancelled || !navigator.onLine || isSaveInFlight()) return;
      const snapshot = await refreshSnapshot(currentUserId);
      if (!snapshot || Date.now() - lastWarmAt < WARM_INTERVAL_MS) return;
      if (await warmOfflinePages(snapshot.permissions)) lastWarmAt = Date.now();
    }

    /** Returns true when the run changed something on the server. */
    async function sync(force = false): Promise<boolean> {
      if (cancelled || syncing || !navigator.onLine) return false;
      if (!force && Date.now() < backoffUntil) return false;
      if (!useOfflineStore.getState().items.some((item) => item.status !== "failed")) return false;
      syncing = true;
      patch({ syncing: true });
      try {
        const result = await runOutboxSync(currentUserId);
        if (result.transientError) {
          transientFailures += 1;
          backoffUntil = Date.now() + Math.min(SYNC_INTERVAL_MS * 2 ** (transientFailures - 1), MAX_BACKOFF_MS);
        } else if (!result.skipped) {
          transientFailures = 0;
          backoffUntil = 0;
        }
        if (result.synced > 0) toast.success(tRef.current("syncedCount", { count: result.synced }));
        if (result.failed > 0) toast.error(tRef.current("syncFailedCount", { count: result.failed }));
        const changed = result.synced > 0 || result.failed > 0;
        if (changed && !cancelled) router.refresh();
        return changed;
      } catch {
        return false;
      } finally {
        syncing = false;
        if (!cancelled) patch({ syncing: false });
      }
    }

    async function syncThenRefresh(force: boolean) {
      const changed = await sync(force);
      if (force || changed) await refresh();
    }

    patch({ requestSync: () => void syncThenRefresh(true) });
    const unsubscribe = subscribeOfflineChange(() => void loadOfflineState(currentUserId));

    let cancelStartup = () => {};
    void (async () => {
      try {
        // A different user signed in on this device: drop the previous user's snapshot and cached screens.
        if ((await readLastUserId()) !== currentUserId) {
          await clearOfflineSession();
          await writeLastUserId(currentUserId);
        }
      } catch {
        // Storage unavailable — loadOfflineState marks offline mode unavailable.
      }
      await loadOfflineState(currentUserId);
      if (!cancelled) cancelStartup = whenIdle(() => void syncThenRefresh(true));
    })();

    const onOnline = () => {
      transientFailures = 0;
      backoffUntil = 0;
      void syncThenRefresh(true);
    };
    window.addEventListener("online", onOnline);
    const syncTimer = window.setInterval(() => void syncThenRefresh(false), SYNC_INTERVAL_MS);
    const snapshotTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, SNAPSHOT_INTERVAL_MS);

    return () => {
      cancelled = true;
      cancelStartup();
      unsubscribe();
      window.removeEventListener("online", onOnline);
      window.clearInterval(syncTimer);
      window.clearInterval(snapshotTimer);
      patch({ requestSync: () => {} });
    };
  }, [userId, patch, router]);

  return null;
}
