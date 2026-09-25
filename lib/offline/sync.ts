import { createCollection } from "@/actions/collections.actions";
import { createPayment } from "@/actions/payments.actions";
import { createPurchase } from "@/actions/purchases.actions";
import { createSale } from "@/actions/sales.actions";
import { deleteOutboxItem, readOutbox, writeOutboxItem } from "@/lib/offline/db";
import { notifyOfflineChange } from "@/lib/offline/outbox";
import type { DocumentCreateResult, OutboxItem, OutboxSyncResult } from "@/types";

const LOCK_NAME = "erp-outbox-sync";

function submit(item: OutboxItem): Promise<DocumentCreateResult> {
  switch (item.kind) {
    case "sale":
      return createSale(item.payload);
    case "purchase":
      return createPurchase(item.payload);
    case "collection":
      return createCollection(item.payload);
    case "payment":
      return createPayment(item.payload);
  }
}

/** The most specific reason the server gave — field errors name the exact problem. */
export function rejectionMessage(result: Extract<DocumentCreateResult, { success: false }>): string {
  return Object.values(result.fieldErrors ?? {}).flat().find(Boolean) ?? result.error;
}

async function processQueue(userId: string): Promise<OutboxSyncResult> {
  const result: OutboxSyncResult = { synced: 0, failed: 0, transientError: false, skipped: false };
  // Inside the lock nobody else is syncing, so a "syncing" row is left over from a closed tab.
  const queue = (await readOutbox()).filter((item) => item.userId === userId && item.status !== "failed");

  // Strictly oldest first, one at a time: a collection may depend on an earlier offline sale.
  for (const item of queue) {
    if (!navigator.onLine) {
      result.transientError = true;
      break;
    }
    await writeOutboxItem({ ...item, status: "syncing" });
    notifyOfflineChange();

    let response: DocumentCreateResult;
    try {
      response = await submit(item);
    } catch {
      // Network/transport failure: keep it queued and stop — later items would fail the same way.
      await writeOutboxItem({ ...item, status: "pending", attempts: item.attempts + 1 });
      notifyOfflineChange();
      result.transientError = true;
      break;
    }

    if (response.success) {
      await deleteOutboxItem(item.clientRequestId);
      result.synced += 1;
    } else {
      // Business rejection (stock, balance…): retrying won't help, the user decides. Carry on with the rest.
      await writeOutboxItem({ ...item, status: "failed", error: rejectionMessage(response), attempts: item.attempts + 1 });
      result.failed += 1;
    }
    notifyOfflineChange();
  }
  return result;
}

/**
 * Sends the signed-in user's queued operations. A Web Lock keeps two open tabs from
 * sending the same item at once (the server is idempotent, this only saves wasted calls).
 */
export async function runOutboxSync(userId: string): Promise<OutboxSyncResult> {
  if (typeof navigator.locks?.request !== "function") return processQueue(userId);
  return navigator.locks.request(LOCK_NAME, { ifAvailable: true }, async (lock) =>
    lock ? processQueue(userId) : { synced: 0, failed: 0, transientError: false, skipped: true },
  );
}
