import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { ReturnFormView } from "@/components/shared/returns/return-form-view";
import { EmptyState } from "@/components/shared/empty-state";
import { getSaleReturnFormOptions } from "@/actions/returns.actions";

export default async function NewSalesReturnPage() {
  const t = await getTranslations("returns");
  const result = await getSaleReturnFormOptions();

  return (
    <>
      <PageHeader
        title={t("newSaleTitle")}
        breadcrumbs={[{ labelKey: "nav.salesReturns", href: "/sales-returns" }, { labelKey: "returns.newSaleTitle" }]}
      />
      {result.success ? (
        <ReturnFormView documentType="SALE_RETURN" options={result.data} />
      ) : (
        <EmptyState title={result.error} />
      )}
    </>
  );
}
