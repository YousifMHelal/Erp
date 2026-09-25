import { shopDateOnly } from "@/lib/format";
import { deleteOutboxItem, readOutbox, readOutboxItem, readSnapshot, writeOutboxItem } from "@/lib/offline/db";
import { applyOutbox, operationAmount } from "@/lib/offline/overlay";
import { useOfflineStore } from "@/stores/offline.store";
import type { OutboxItem, OutboxOperation } from "@/types";

const CHANNEL_NAME = "erp-offline";
const localListeners = new Set<() => void>();
let channel: BroadcastChannel | null | undefined;

function getChannel(): BroadcastChannel | null {
  if (channel === undefined) channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

/** Tells this tab and every other open tab that the outbox or snapshot changed. */
export function notifyOfflineChange() {
  localListeners.forEach((listener) => listener());
  getChannel()?.postMessage("changed");
}

export function subscribeOfflineChange(listener: () => void): () => void {
  localListeners.add(listener);
  const bus = getChannel();
  const onMessage = () => listener();
  bus?.addEventListener("message", onMessage);
  return () => {
    localListeners.delete(listener);
    bus?.removeEventListener("message", onMessage);
  };
}

/** Reloads the store from IndexedDB. Never throws: a failure marks offline mode unavailable. */
let loadSequence = 0;

export async function loadOfflineState(userId: string): Promise<void> {
  // Change events arrive in bursts; only the newest read may write the store.
  const sequence = ++loadSequence;
  try {
    const [base, outbox] = await Promise.all([readSnapshot(userId), readOutbox()]);
    if (sequence !== loadSequence) return;
    const items = outbox.filter((item) => item.userId === userId);
    useOfflineStore.getState().patch({
      available: true,
      userId,
      items,
      otherUsersPending: outbox.length - items.length,
      snapshot: base ? applyOutbox(base, items) : null,
    });
  } catch {
    if (sequence !== loadSequence) return;
    useOfflineStore.getState().patch({ available: false, userId, items: [], otherUsersPending: 0, snapshot: null });
  }
}

/** UUID v4 — `crypto.randomUUID` exists only on secure origins, so plain-HTTP LAN installs fall back. */
export function newRequestId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Stamps the creation time so a later sync doesn't re-date the document to the sync moment. */
function withOfflineDate(operation: OutboxOperation, createdAt: Date): OutboxOperation {
  switch (operation.kind) {
    case "sale":
      return { kind: "sale", payload: { ...operation.payload, issuedAt: shopDateOnly(createdAt) } };
    case "purchase":
      return { kind: "purchase", payload: { ...operation.payload, issuedAt: shopDateOnly(createdAt) } };
    case "collection":
      return { kind: "collection", payload: { ...operation.payload, occurredAt: createdAt.toISOString() } };
    case "payment":
      return { kind: "payment", payload: { ...operation.payload, occurredAt: createdAt.toISOString() } };
  }
}

/** Puts an operation in the outbox. Throws if the device can't store it. */
export async function enqueueOperation(input: {
  operation: OutboxOperation;
  clientRequestId: string;
  userId: string;
  partyName: string | null;
}): Promise<void> {
  const createdAt = new Date();
  const operation = withOfflineDate(input.operation, createdAt);
  const item = {
    ...operation,
    payload: { ...operation.payload, clientRequestId: input.clientRequestId },
    clientRequestId: input.clientRequestId,
    userId: input.userId,
    partyName: input.partyName,
    amount: operationAmount(operation),
    createdAt: createdAt.toISOString(),
    status: "pending",
    attempts: 0,
  } as OutboxItem;
  await writeOutboxItem(item);
  notifyOfflineChange();
}

/** Puts a failed item back in the queue; the next sync run sends it again with the same id. */
export async function retryOutboxItem(clientRequestId: string): Promise<void> {
  const item = await readOutboxItem(clientRequestId);
  if (!item || item.status !== "failed") return;
  await writeOutboxItem({ ...item, status: "pending", error: undefined });
  notifyOfflineChange();
}

export async function discardOutboxItem(clientRequestId: string): Promise<void> {
  await deleteOutboxItem(clientRequestId);
  notifyOfflineChange();
}
