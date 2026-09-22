import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { SaleDetailView } from "@/components/sales/sale-detail-view";
import { getSaleById } from "@/actions/sales.actions";
import { getCurrentUser } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import type { SaleDetailPageProps } from "@/types";

export default async function SaleDetailPage({ params }: SaleDetailPageProps) {
  const t = await getTranslations("invoices.detail");
  const { id } = await params;

  const [result, user] = await Promise.all([getSaleById(id), getCurrentUser()]);
  if (!result.success) notFound();

  const permissions = user?.role.permissions ?? [];

  return (
    <>
      <PageHeader
        title={t("title", { number: String(result.data.number).padStart(6, "0") })}
        breadcrumbs={[
          { labelKey: "nav.sales", href: "/sales" },
          { labelKey: "invoices.detail.breadcrumbSale" },
        ]}
      />
      <SaleDetailView
        sale={result.data}
        canEdit={hasPermission(permissions, "sale.edit")}
        canCancel={hasPermission(permissions, "sale.cancel")}
      />
    </>
  );
}
