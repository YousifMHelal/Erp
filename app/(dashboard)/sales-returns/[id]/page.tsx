import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { ReturnDetailView } from "@/components/shared/returns/return-detail-view";
import { getSaleReturnById } from "@/actions/returns.actions";
import { getCurrentUser } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";

export default async function SalesReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("invoices.detail");
  const { id } = await params;

  const [result, user] = await Promise.all([getSaleReturnById(id), getCurrentUser()]);
  if (!result.success) notFound();

  const permissions = user?.role.permissions ?? [];

  return (
    <>
      <PageHeader
        title={t("title", { number: String(result.data.number).padStart(6, "0") })}
        breadcrumbs={[{ labelKey: "nav.salesReturns", href: "/sales-returns" }, { labelKey: "invoices.detail.breadcrumbSale" }]}
      />
      <ReturnDetailView invoice={result.data} canCancel={hasPermission(permissions, "return.cancel")} />
    </>
  );
}
