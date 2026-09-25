import { searchPurchaseProducts } from "@/actions/purchases.actions";
import { searchSaleProducts } from "@/actions/sales.actions";
import { searchSnapshotProducts } from "@/lib/offline/overlay";
import { useOfflineStore } from "@/stores/offline.store";
import type { ActionResult, OfflineSnapshot, SaleProductOption } from "@/types";

const SNAPSHOT_WAIT_MS = 3_000;

/** A page opened offline mounts before the device snapshot finishes loading — give it a moment. */
function waitForSnapshot(): Promise<OfflineSnapshot | null> {
  const current = useOfflineStore.getState().snapshot;
  if (current) return Promise.resolve(current);
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, SNAPSHOT_WAIT_MS);
    const unsubscribe = useOfflineStore.subscribe((state) => {
      if (!state.snapshot) return;
      window.clearTimeout(timer);
      unsubscribe();
      resolve(state.snapshot);
    });
  });
}

async function searchWithFallback(
  kind: "sale" | "purchase",
  query: string,
  searchServer: (query: string) => Promise<ActionResult<SaleProductOption[]>>,
): Promise<ActionResult<SaleProductOption[]>> {
  const searchLocally = async (): Promise<ActionResult<SaleProductOption[]>> => {
    const snapshot = await waitForSnapshot();
    return snapshot ? { success: true, data: searchSnapshotProducts(snapshot, query, kind) } : { success: false, error: "" };
  };
  if (!navigator.onLine) return searchLocally();
  try {
    return await searchServer(query);
  } catch {
    return searchLocally();
  }
}

/**
 * Product search for the invoice forms. Online it is the server search, unchanged; with no
 * connection (or when the call fails in transit) it searches the device snapshot instead.
 */
export function searchSaleProductsOfflineAware(query: string) {
  return searchWithFallback("sale", query, searchSaleProducts);
}

export function searchPurchaseProductsOfflineAware(query: string) {
  return searchWithFallback("purchase", query, searchPurchaseProducts);
}
