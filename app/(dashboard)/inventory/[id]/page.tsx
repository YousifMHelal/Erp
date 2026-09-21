import { PageHeader } from "@/components/shared/page-header";
import { ProductSummaryCard } from "@/components/inventory/product-summary-card";
import { StockMovementTable } from "@/components/inventory/stock-movement-table";
import { ProductPriceHistory } from "@/components/inventory/product-price-history";
import type { PriceHistoryEntry, ProductDetail, StockMovementRow } from "@/types";

const PRODUCT: ProductDetail = {
  id: "1",
  name: "أرز أبو كاس ٥ كجم",
  sku: "RIC-001",
  barcode: "6221031001015",
  categoryName: "مواد غذائية",
  stockQty: 42,
  baseUnitName: "كرتونة",
  subUnitName: "كيس",
  unitsPerBase: 10,
  purchasePricePerBase: "1000.00",
  sellPricePerBase: "1200.00",
  avgCostPerSub: "98.50",
  minStockQty: 10,
  isActive: true,
  notes: "يُفضَّل تخزينه في مكان جاف بعيداً عن الرطوبة.",
  createdAt: "2026-08-01",
};

const MOVEMENTS: StockMovementRow[] = [
  { id: "1", type: "SALE", qtyInSub: -5, balanceAfter: 42, refLabel: "فاتورة #001042", createdAt: "2026-09-21" },
  { id: "2", type: "PURCHASE", qtyInSub: 50, balanceAfter: 47, refLabel: "فاتورة شراء #000512", createdAt: "2026-09-20" },
  { id: "3", type: "SALE_RETURN", qtyInSub: 2, balanceAfter: -3, refLabel: "مرتجع بيع #000034", createdAt: "2026-09-20" },
  { id: "4", type: "SALE", qtyInSub: -8, balanceAfter: -5, refLabel: "فاتورة #001035", createdAt: "2026-09-18" },
];

const PRICE_HISTORY: PriceHistoryEntry[] = [
  { id: "1", changedAt: "2026-09-15", fieldLabel: "سعر البيع", oldValue: "1150.00 ج.م", newValue: "1200.00 ج.م", changedByName: "أحمد سعيد" },
  { id: "2", changedAt: "2026-08-20", fieldLabel: "سعر الشراء", oldValue: "950.00 ج.م", newValue: "1000.00 ج.م", changedByName: "أحمد سعيد" },
];

export default function ProductDetailPage() {
  return (
    <>
      <PageHeader
        title={PRODUCT.name}
        breadcrumbs={[{ labelKey: "nav.inventory", href: "/inventory" }, { labelKey: "inventory.detail.breadcrumb" }]}
      />
      <div className="flex flex-col gap-4">
        <ProductSummaryCard product={PRODUCT} />
        <StockMovementTable movements={MOVEMENTS} />
        <ProductPriceHistory entries={PRICE_HISTORY} />
      </div>
    </>
  );
}
