import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StocktakeDetailView } from "@/components/inventory/stocktake/stocktake-detail-view";
import { getStocktakeById } from "@/actions/stocktake.actions";
import { getCurrentUser } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import type { StocktakeDetailPageProps } from "@/types";

const STATUS_TONE = { DRAFT: "info", CONFIRMED: "success", CANCELLED: "danger" } as const;

export default async function StocktakeDetailPage({ params }: StocktakeDetailPageProps) {
  const { id } = await params;
  const t = await getTranslations("inventory.stocktake");
  const tStatus = await getTranslations("inventory.stocktake.status");
  const [result, user] = await Promise.all([getStocktakeById(id), getCurrentUser()]);
  if (!result.success) notFound();

  const permissions = user?.role.permissions ?? [];
  const canManage = hasPermission(permissions, "inventory.stocktake") && result.data.status === "CONFIRMED";

  return (
    <>
      <PageHeader
        title={t("detailTitle", { number: String(result.data.number).padStart(4, "0") })}
        breadcrumbs={[
          { labelKey: "nav.inventory", href: "/inventory" },
          { labelKey: "inventory.stocktake.listTitle", href: "/inventory/stocktake" },
          { labelKey: "inventory.stocktake.detailBreadcrumb" },
        ]}
        actions={<StatusBadge tone={STATUS_TONE[result.data.status]} label={tStatus(result.data.status)} />}
      />
      <StocktakeDetailView stocktake={result.data} canEdit={canManage} canDelete={canManage} />
    </>
  );
}
