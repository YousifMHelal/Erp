import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { SaleForm } from "@/components/sales/sale-form";
import { getSaleForEdit } from "@/actions/sales.actions";
import type { EditSalePageProps } from "@/types";

export default async function EditSalePage({ params }: EditSalePageProps) {
  const t = await getTranslations("invoices.form");
  const { id } = await params;
  const result = await getSaleForEdit(id);
  if (!result.success) notFound();

  const { options, sale } = result.data;

  return (
    <div className="flex min-h-[calc(100dvh-9.5rem)] flex-col">
      <PageHeader
        title={t("titleEditSale", { number: String(sale.number).padStart(6, "0") })}
        breadcrumbs={[
          { labelKey: "nav.sales", href: "/sales" },
          { labelKey: "invoices.detail.breadcrumbEditSale" },
        ]}
      />
      <SaleForm options={options} initialSale={sale} />
    </div>
  );
}
