import { clearSnapshots, writeSnapshot } from "@/lib/offline/db";
import { notifyOfflineChange } from "@/lib/offline/outbox";
import type { OfflineSnapshot } from "@/types";

/** The create screens that open without a connection. Mirrored in public/sw.js. */
export const OFFLINE_ROUTES = {
  sale: "/sales/new",
  purchase: "/purchases/new",
  collection: "/collections/new",
  payment: "/payments/new",
} as const;

const OFFLINE_ROUTE_SET = new Set<string>(Object.values(OFFLINE_ROUTES));

export function isOfflineRoute(pathname: string): boolean {
  return OFFLINE_ROUTE_SET.has(pathname);
}

/**
 * Fetches and stores a fresh snapshot. Silent by design: any failure (offline, signed out,
 * storage unavailable) leaves the previous snapshot in place and returns null.
 */
export async function refreshSnapshot(userId: string): Promise<OfflineSnapshot | null> {
  try {
    const response = await fetch("/api/offline/snapshot", { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) return null;
    const snapshot = (await response.json()) as OfflineSnapshot;
    if (snapshot.userId !== userId) return null;
    await writeSnapshot(snapshot);
    notifyOfflineChange();
    return snapshot;
  } catch {
    return null;
  }
}

async function postToServiceWorker(message: { type: string; paths?: string[] }): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator)) return false;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration?.active) return false;
    registration.active.postMessage(message);
    return true;
  } catch {
    return false;
  }
}

/** Asks the service worker to cache the create screens the user may open offline (and their assets). */
export function warmOfflinePages(permissions: OfflineSnapshot["permissions"]): Promise<boolean> {
  const paths = (Object.keys(OFFLINE_ROUTES) as (keyof typeof OFFLINE_ROUTES)[])
    .filter((kind) => permissions[kind])
    .map((kind) => OFFLINE_ROUTES[kind]);
  return postToServiceWorker({ type: "warm-offline-pages", paths });
}

/**
 * Forgets the signed-in user's device copy (snapshot + cached create screens). The outbox is
 * kept on purpose: queued sales must survive a logout and sync when their owner signs in again.
 */
export async function clearOfflineSession(): Promise<void> {
  await postToServiceWorker({ type: "clear-offline-pages" });
  try {
    await clearSnapshots();
    notifyOfflineChange();
  } catch {
    // Storage unavailable — nothing was stored either.
  }
}
