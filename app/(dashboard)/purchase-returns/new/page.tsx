import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { ReturnFormView } from "@/components/shared/returns/return-form-view";
import { EmptyState } from "@/components/shared/empty-state";
import { getPurchaseReturnFormOptions } from "@/actions/returns.actions";

export default async function NewPurchaseReturnPage() {
  const t = await getTranslations("returns");
  const result = await getPurchaseReturnFormOptions();

  return (
    <>
      <PageHeader
        title={t("newPurchaseTitle")}
        breadcrumbs={[{ labelKey: "nav.purchaseReturns", href: "/purchase-returns" }, { labelKey: "returns.newPurchaseTitle" }]}
      />
      {result.success ? (
        <ReturnFormView documentType="PURCHASE_RETURN" options={result.data} />
      ) : (
        <EmptyState title={result.error} />
      )}
    </>
  );
}
