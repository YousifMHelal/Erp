import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { SaleForm } from "@/components/sales/sale-form";
import { EmptyState } from "@/components/shared/empty-state";
import { getSaleFormOptions } from "@/actions/sales.actions";
import type { SaleFormOptions } from "@/types";

export default async function NewSalePage() {
  const t = await getTranslations("invoices.form");
  const result = await getSaleFormOptions();
  const options: SaleFormOptions = result.success
    ? result.data
    : { customers: [], cashboxes: [] };

  return (
    <div className="flex min-h-[calc(100dvh-9.5rem)] flex-col">
      <PageHeader
        title={t("titleSale")}
        breadcrumbs={[
          { labelKey: "nav.sales", href: "/sales" },
          { labelKey: "invoices.form.titleSale" },
        ]}
      />
      {result.success ? (
        <SaleForm options={options} />
      ) : (
        <EmptyState title={result.error} />
      )}
    </div>
  );
}
