import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { EmptyState } from "@/components/shared/empty-state";
import { getPurchaseFormOptions } from "@/actions/purchases.actions";
import type { PurchaseFormOptions } from "@/types";

export default async function NewPurchasePage() {
  const t = await getTranslations("invoices.form");
  const result = await getPurchaseFormOptions();
  const options: PurchaseFormOptions = result.success
    ? result.data
    : { suppliers: [], cashboxes: [] };

  return (
    <div className="flex min-h-[calc(100dvh-9.5rem)] flex-col">
      <PageHeader
        title={t("titlePurchase")}
        breadcrumbs={[{ labelKey: "nav.purchases", href: "/purchases" }, { labelKey: "invoices.form.titlePurchase" }]}
      />
      {result.success ? (
        <PurchaseForm options={options} />
      ) : (
        <EmptyState title={result.error} />
      )}
    </div>
  );
}
