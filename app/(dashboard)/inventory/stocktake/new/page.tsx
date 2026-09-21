import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { NewStocktakeView } from "@/components/inventory/stocktake/new-stocktake-view";
import type { StocktakeLineDraft } from "@/types";

const INITIAL_LINES: StocktakeLineDraft[] = [
  { id: "1", productId: "1", productName: "أرز أبو كاس ٥ كجم", unitName: "كيس", systemQty: 42, countedQty: null },
  { id: "2", productId: "2", productName: "زيت عافية ١.٥ لتر", unitName: "زجاجة", systemQty: 0, countedQty: null },
  { id: "3", productId: "3", productName: "سكر ٢ كجم", unitName: "كيس", systemQty: 6, countedQty: null },
  { id: "4", productId: "4", productName: "شاي العروسة ٥٠ فتلة", unitName: "علبة", systemQty: 58, countedQty: null },
];

export default function NewStocktakePage() {
  const t = useTranslations("inventory.stocktake");

  return (
    <>
      <PageHeader
        title={t("newTitle")}
        breadcrumbs={[
          { labelKey: "nav.inventory", href: "/inventory" },
          { labelKey: "inventory.stocktake.listTitle", href: "/inventory/stocktake" },
          { labelKey: "inventory.stocktake.newTitle" },
        ]}
      />
      <NewStocktakeView initialLines={INITIAL_LINES} />
    </>
  );
}
