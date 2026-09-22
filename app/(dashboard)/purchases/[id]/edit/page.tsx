import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { getPurchaseForEdit } from "@/actions/purchases.actions";
import type { EditPurchasePageProps } from "@/types";

export default async function EditPurchasePage({ params }: EditPurchasePageProps) {
  const t = await getTranslations("invoices.form");
  const { id } = await params;
  const result = await getPurchaseForEdit(id);
  if (!result.success) notFound();

  const { options, purchase } = result.data;

  return (
    <div className="flex min-h-[calc(100dvh-9.5rem)] flex-col">
      <PageHeader
        title={t("titleEditPurchase", { number: String(purchase.number).padStart(6, "0") })}
        breadcrumbs={[
          { labelKey: "nav.purchases", href: "/purchases" },
          { labelKey: "invoices.detail.breadcrumbEditPurchase" },
        ]}
      />
      <PurchaseForm options={options} initialPurchase={purchase} />
    </div>
  );
}
