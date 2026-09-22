import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { PurchasesListView } from "@/components/purchases/purchases-list-view";
import { getPurchaseListFilterOptions, getPurchases } from "@/actions/purchases.actions";
import { purchasesSearchParamsToFilter } from "@/lib/purchases-filters";
import type { PurchasesListPageProps } from "@/types";

export default async function PurchasesListPage({ searchParams }: PurchasesListPageProps) {
  const t = await getTranslations("invoices.list");
  const params = await searchParams;
  const filter = purchasesSearchParamsToFilter(params);

  const [purchasesResult, optionsResult] = await Promise.all([
    getPurchases(filter),
    getPurchaseListFilterOptions(),
  ]);

  return (
    <>
      <PageHeader title={t("titlePurchase")} breadcrumbs={[{ labelKey: "nav.purchases" }]} />
      <PurchasesListView
        result={purchasesResult}
        options={optionsResult.success ? optionsResult.data : { suppliers: [], cashboxes: [] }}
        filter={filter}
      />
    </>
  );
}
