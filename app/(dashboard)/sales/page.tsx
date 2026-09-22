import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { SalesListView } from "@/components/sales/sales-list-view";
import { getSaleListFilterOptions, getSales } from "@/actions/sales.actions";
import { salesSearchParamsToFilter } from "@/lib/sales-filters";
import type { SalesListPageProps } from "@/types";

export default async function SalesListPage({ searchParams }: SalesListPageProps) {
  const t = await getTranslations("invoices.list");
  const params = await searchParams;
  const filter = salesSearchParamsToFilter(params);

  const [salesResult, optionsResult] = await Promise.all([
    getSales(filter),
    getSaleListFilterOptions(),
  ]);

  return (
    <>
      <PageHeader title={t("titleSale")} breadcrumbs={[{ labelKey: "nav.sales" }]} />
      <SalesListView
        result={salesResult}
        options={optionsResult.success ? optionsResult.data : { customers: [], cashboxes: [] }}
        filter={filter}
      />
    </>
  );
}
