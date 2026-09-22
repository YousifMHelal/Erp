import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { ReturnsListView } from "@/components/shared/invoice/returns-list-view";
import { getPurchaseReturnListFilterOptions, getPurchaseReturns } from "@/actions/returns.actions";
import { returnsSearchParamsToFilter } from "@/lib/returns-filters";
import type { ReturnsListPageProps } from "@/types";

export default async function PurchaseReturnsListPage({ searchParams }: ReturnsListPageProps) {
  const t = await getTranslations("returns");
  const params = await searchParams;
  const filter = returnsSearchParamsToFilter(params);

  const [result, optionsResult] = await Promise.all([
    getPurchaseReturns(filter),
    getPurchaseReturnListFilterOptions(),
  ]);

  const partyOptions = optionsResult.success
    ? optionsResult.data.map((party) => ({ value: party.id, label: party.name }))
    : [];

  return (
    <>
      <PageHeader title={t("listPurchaseTitle")} breadcrumbs={[{ labelKey: "nav.purchaseReturns" }]} />
      <ReturnsListView
        documentType="PURCHASE"
        result={result}
        partyOptions={partyOptions}
        filter={filter}
        detailBasePath="/purchase-returns"
        newInvoiceHref="/purchase-returns/new"
      />
    </>
  );
}
