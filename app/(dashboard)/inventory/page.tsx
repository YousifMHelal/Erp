import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryGrid } from "@/components/inventory/inventory-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { getCategoryOptions, getProducts } from "@/actions/inventory.actions";

export default async function InventoryPage() {
  const t = await getTranslations("inventory");
  const [productsResult, categoriesResult] = await Promise.all([
    getProducts(),
    getCategoryOptions(),
  ]);

  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.inventory" }]} />
      {productsResult.success ? (
        <InventoryGrid
          products={productsResult.data}
          categoryOptions={categoriesResult.success ? categoriesResult.data : []}
        />
      ) : (
        <EmptyState title={productsResult.error} />
      )}
    </>
  );
}
