"use client";

import { useOfflineStore } from "@/stores/offline.store";
import type { OfflineSnapshot } from "@/types";

/**
 * The device snapshot a create form should take its options from, or null to keep the
 * server-rendered options. Non-null only while offline, or when the page itself was opened
 * offline (its server options are then a cached copy, older than the snapshot).
 */
export function useOfflineFormSnapshot(): OfflineSnapshot | null {
  const snapshot = useOfflineStore((state) => state.snapshot);
  const useSnapshot = useOfflineStore((state) => !state.online || state.loadedOffline);
  return useSnapshot ? snapshot : null;
}
