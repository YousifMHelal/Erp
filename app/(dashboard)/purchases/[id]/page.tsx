import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { PurchaseDetailView } from "@/components/purchases/purchase-detail-view";
import { getPurchaseById } from "@/actions/purchases.actions";
import { getCurrentUser } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import type { PurchaseDetailPageProps } from "@/types";

export default async function PurchaseDetailPage({ params }: PurchaseDetailPageProps) {
  const t = await getTranslations("invoices.detail");
  const { id } = await params;

  const [result, user] = await Promise.all([getPurchaseById(id), getCurrentUser()]);
  if (!result.success) notFound();

  const permissions = user?.role.permissions ?? [];

  return (
    <>
      <PageHeader
        title={t("title", { number: String(result.data.number).padStart(6, "0") })}
        breadcrumbs={[
          { labelKey: "nav.purchases", href: "/purchases" },
          { labelKey: "invoices.detail.breadcrumbPurchase" },
        ]}
      />
      <PurchaseDetailView
        purchase={result.data}
        canEdit={hasPermission(permissions, "purchase.edit")}
        canCancel={hasPermission(permissions, "purchase.cancel")}
      />
    </>
  );
}
