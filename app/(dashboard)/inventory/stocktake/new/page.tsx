import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { NewStocktakeView } from "@/components/inventory/stocktake/new-stocktake-view";
import { EmptyState } from "@/components/shared/empty-state";
import { getNewStocktakeLines } from "@/actions/stocktake.actions";

export default async function NewStocktakePage() {
  const t = await getTranslations("inventory.stocktake");
  const result = await getNewStocktakeLines();

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
      {result.success ? (
        <NewStocktakeView initialLines={result.data} />
      ) : (
        <EmptyState title={result.error} />
      )}
    </>
  );
}
