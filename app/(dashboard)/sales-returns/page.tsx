import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { ReturnsListView } from "@/components/shared/invoice/returns-list-view";
import { getSaleReturnListFilterOptions, getSaleReturns } from "@/actions/returns.actions";
import { returnsSearchParamsToFilter } from "@/lib/returns-filters";
import type { ReturnsListPageProps } from "@/types";

export default async function SalesReturnsListPage({ searchParams }: ReturnsListPageProps) {
  const t = await getTranslations("returns");
  const params = await searchParams;
  const filter = returnsSearchParamsToFilter(params);

  const [result, optionsResult] = await Promise.all([
    getSaleReturns(filter),
    getSaleReturnListFilterOptions(),
  ]);

  const partyOptions = optionsResult.success
    ? optionsResult.data.map((party) => ({ value: party.id, label: party.name }))
    : [];

  return (
    <>
      <PageHeader title={t("listSaleTitle")} breadcrumbs={[{ labelKey: "nav.salesReturns" }]} />
      <ReturnsListView
        documentType="SALE"
        result={result}
        partyOptions={partyOptions}
        filter={filter}
        detailBasePath="/sales-returns"
        newInvoiceHref="/sales-returns/new"
      />
    </>
  );
}
