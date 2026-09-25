import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { OfflineSnapshot, OutboxItem } from "@/types";

/**
 * Device-side IndexedDB store for offline mode. Every function may throw (private mode,
 * quota, IndexedDB missing) — callers treat a throw as "offline mode unavailable" and
 * must never let it reach the UI.
 */
interface OfflineDbSchema extends DBSchema {
  /** At most one record: the signed-in user's snapshot. */
  snapshot: { key: string; value: OfflineSnapshot };
  outbox: { key: string; value: OutboxItem };
  meta: { key: string; value: string };
}

const DB_NAME = "erp-offline";
const LAST_USER_KEY = "lastUserId";

let dbPromise: Promise<IDBPDatabase<OfflineDbSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<OfflineDbSchema>> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB unavailable"));
  dbPromise ??= openDB<OfflineDbSchema>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore("snapshot", { keyPath: "userId" });
      db.createObjectStore("outbox", { keyPath: "clientRequestId" });
      db.createObjectStore("meta");
    },
  }).catch((error: unknown) => {
    dbPromise = null;
    throw error;
  });
  return dbPromise;
}

export async function readSnapshot(userId: string): Promise<OfflineSnapshot | null> {
  return (await (await getDb()).get("snapshot", userId)) ?? null;
}

/** Replaces whatever snapshot is stored — the store only ever holds the current user's. */
export async function writeSnapshot(snapshot: OfflineSnapshot): Promise<void> {
  const tx = (await getDb()).transaction("snapshot", "readwrite");
  await tx.store.clear();
  await tx.store.put(snapshot);
  await tx.done;
}

export async function clearSnapshots(): Promise<void> {
  await (await getDb()).clear("snapshot");
}

export async function readOutbox(): Promise<OutboxItem[]> {
  const items = await (await getDb()).getAll("outbox");
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function readOutboxItem(clientRequestId: string): Promise<OutboxItem | null> {
  return (await (await getDb()).get("outbox", clientRequestId)) ?? null;
}

export async function writeOutboxItem(item: OutboxItem): Promise<void> {
  await (await getDb()).put("outbox", item);
}

export async function deleteOutboxItem(clientRequestId: string): Promise<void> {
  await (await getDb()).delete("outbox", clientRequestId);
}

export async function readLastUserId(): Promise<string | null> {
  return (await (await getDb()).get("meta", LAST_USER_KEY)) ?? null;
}

export async function writeLastUserId(userId: string): Promise<void> {
  await (await getDb()).put("meta", userId, LAST_USER_KEY);
}
