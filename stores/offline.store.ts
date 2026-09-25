import { create } from "zustand";
import type { OfflineSnapshot, OutboxItem } from "@/types";

type OfflineStore = {
  /** False when IndexedDB can't be used on this device — offline saving is then unavailable. */
  available: boolean;
  online: boolean;
  /** The page itself was opened without a connection, so its server-rendered options are a cached copy. */
  loadedOffline: boolean;
  userId: string | null;
  /** Server snapshot with the pending outbox applied (see applyOutbox). */
  snapshot: OfflineSnapshot | null;
  /** The signed-in user's outbox, oldest first. */
  items: OutboxItem[];
  /** Operations saved on this device by other users — synced only when they sign in. */
  otherUsersPending: number;
  syncing: boolean;
  /** Set by OfflineProvider; lets the UI ask for an immediate sync run. */
  requestSync: () => void;
  patch: (next: Partial<Omit<OfflineStore, "patch">>) => void;
};

export const useOfflineStore = create<OfflineStore>()((set) => ({
  available: true,
  online: true,
  loadedOffline: false,
  userId: null,
  snapshot: null,
  items: [],
  otherUsersPending: 0,
  syncing: false,
  requestSync: () => {},
  patch: (next) => set(next),
}));
