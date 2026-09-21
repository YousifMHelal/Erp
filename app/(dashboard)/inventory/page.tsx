import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryGrid } from "@/components/inventory/inventory-grid";
import type { EntityComboboxOption, InventoryProductRow } from "@/types";

const PRODUCTS: InventoryProductRow[] = [
  {
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
  },
  {
    id: "2",
    name: "زيت عافية ١.٥ لتر",
    sku: "OIL-014",
    barcode: "6221031001022",
    categoryName: "زيوت",
    stockQty: 0,
    baseUnitName: "كرتونة",
    subUnitName: "زجاجة",
    unitsPerBase: 12,
    purchasePricePerBase: "780.00",
    sellPricePerBase: "960.00",
    avgCostPerSub: "65.00",
    minStockQty: 12,
    isActive: true,
  },
  {
    id: "3",
    name: "سكر ٢ كجم",
    sku: "SUG-007",
    barcode: "6221031001039",
    categoryName: "مواد غذائية",
    stockQty: 6,
    baseUnitName: "كرتونة",
    subUnitName: "كيس",
    unitsPerBase: 8,
    purchasePricePerBase: "400.00",
    sellPricePerBase: "480.00",
    avgCostPerSub: "49.20",
    minStockQty: 15,
    isActive: true,
  },
  {
    id: "4",
    name: "شاي العروسة ٥٠ فتلة",
    sku: "TEA-003",
    barcode: "6221031001046",
    categoryName: "مشروبات",
    stockQty: 58,
    baseUnitName: "كرتونة",
    subUnitName: "علبة",
    unitsPerBase: 24,
    purchasePricePerBase: "600.00",
    sellPricePerBase: "720.00",
    avgCostPerSub: "24.80",
    minStockQty: 20,
    isActive: true,
  },
];

const CATEGORIES: EntityComboboxOption[] = [
  { value: "مواد غذائية", label: "مواد غذائية" },
  { value: "زيوت", label: "زيوت" },
  { value: "مشروبات", label: "مشروبات" },
];

export default function InventoryPage() {
  const t = useTranslations("inventory");

  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.inventory" }]} />
      <InventoryGrid products={PRODUCTS} categoryOptions={CATEGORIES} />
    </>
  );
}
