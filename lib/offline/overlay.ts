import type { Prisma } from "@prisma/client";
import { decimal, lineAmount } from "@/lib/money";
import { toSubUnits } from "@/lib/units";
import type {
  OfflineParty,
  OfflinePurchasePayload,
  OfflineSalePayload,
  OfflineSnapshot,
  OutboxItem,
  OutboxOperation,
  SaleProductOption,
} from "@/types";

type Balances = Map<string, Prisma.Decimal>;

function invoiceTotals(payload: OfflineSalePayload | OfflinePurchasePayload) {
  const subtotal = payload.lines.reduce((sum, line) => sum.plus(lineAmount(line.qtyInUnit, line.unitPrice)), decimal(0));
  const total = subtotal.minus(payload.discountAmount);
  return { total, paid: decimal(payload.paidAmount) };
}

/** What the outbox shows as the document's value: invoice total or money-document amount. */
export function operationAmount(operation: OutboxOperation): string {
  if (operation.kind === "sale" || operation.kind === "purchase") return invoiceTotals(operation.payload).total.toFixed(2);
  return decimal(operation.payload.amount).toFixed(2);
}

function toBalances(parties: OfflineParty[]): Balances {
  return new Map(parties.map((party) => [party.id, decimal(party.balance)]));
}

function shift(balances: Balances, id: string | undefined, delta: Prisma.Decimal) {
  if (!id) return;
  const current = balances.get(id);
  if (current) balances.set(id, current.plus(delta));
}

function withBalances(parties: OfflineParty[], balances: Balances): OfflineParty[] {
  return parties.map((party) => ({ ...party, balance: balances.get(party.id)?.toString() ?? party.balance }));
}

/**
 * The snapshot as the device should see it: the server copy plus the effect of every
 * operation still waiting in the outbox. Kept as a derived view (never written back) so a
 * fresh server snapshot can never double-count an entry that has not synced yet.
 */
export function applyOutbox(base: OfflineSnapshot, items: OutboxItem[]): OfflineSnapshot {
  const active = items.filter((item) => item.status !== "failed");
  if (active.length === 0) return base;

  const products = new Map(base.products.map((product) => [product.id, product]));
  const stock: Balances = new Map(base.products.map((product) => [product.id, decimal(product.stockQty)]));
  const customers = toBalances(base.customers);
  const suppliers = toBalances(base.suppliers);
  const cashboxes = toBalances(base.cashboxes);

  function moveStock(payload: OfflineSalePayload | OfflinePurchasePayload, direction: 1 | -1) {
    for (const line of payload.lines) {
      const product = products.get(line.productId);
      if (!product) continue;
      shift(stock, line.productId, toSubUnits(line.qtyInUnit, line.unitType, product.unitsPerBase).mul(direction));
    }
  }

  for (const item of active) {
    switch (item.kind) {
      case "sale": {
        const { total, paid } = invoiceTotals(item.payload);
        moveStock(item.payload, -1);
        shift(cashboxes, item.payload.cashboxId, paid);
        shift(customers, item.payload.customerId, total.minus(paid));
        break;
      }
      case "purchase": {
        const { total, paid } = invoiceTotals(item.payload);
        moveStock(item.payload, 1);
        shift(cashboxes, item.payload.cashboxId, paid.neg());
        shift(suppliers, item.payload.supplierId, total.minus(paid));
        break;
      }
      case "collection":
        shift(cashboxes, item.payload.cashboxId, decimal(item.payload.amount));
        shift(customers, item.payload.customerId, decimal(item.payload.amount).neg());
        break;
      case "payment":
        shift(cashboxes, item.payload.cashboxId, decimal(item.payload.amount).neg());
        shift(suppliers, item.payload.supplierId, decimal(item.payload.amount).neg());
        break;
    }
  }

  return {
    ...base,
    products: base.products.map((product) => ({
      ...product,
      stockQty: stock.get(product.id)?.toString() ?? product.stockQty,
    })),
    customers: withBalances(base.customers, customers),
    suppliers: withBalances(base.suppliers, suppliers),
    cashboxes: withBalances(base.cashboxes, cashboxes),
  };
}

/**
 * Offline stand-in for searchSaleProducts / searchPurchaseProducts: same result shape,
 * same rules — an exact barcode wins alone, otherwise name/SKU/barcode contains, max 20.
 */
export function searchSnapshotProducts(
  snapshot: OfflineSnapshot,
  rawQuery: string,
  priceKind: "sale" | "purchase",
): SaleProductOption[] {
  const query = rawQuery.trim();
  const toOption = (product: OfflineSnapshot["products"][number], exactBarcodeMatch: boolean): SaleProductOption => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    baseUnitName: product.baseUnitName,
    subUnitName: product.subUnitName,
    unitsPerBase: product.unitsPerBase,
    stockQty: product.stockQty,
    pricePerBase: priceKind === "sale" ? product.salePricePerBase : product.purchasePricePerBase,
    pricePerSub: priceKind === "sale" ? product.salePricePerSub : product.purchasePricePerSub,
    exactBarcodeMatch,
  });

  if (query) {
    const exact = snapshot.products.find((product) => product.barcode === query);
    if (exact) return [toOption(exact, true)];
  }
  const needle = query.toLocaleLowerCase();
  return snapshot.products
    .filter(
      (product) =>
        !needle ||
        product.name.toLocaleLowerCase().includes(needle) ||
        product.sku.toLocaleLowerCase().includes(needle) ||
        (product.barcode?.includes(query) ?? false),
    )
    .slice(0, 20)
    .map((product) => toOption(product, false));
}
