import Link from "next/link";
import { ClipboardPlus, ClipboardList } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { getStocktakes } from "@/actions/stocktake.actions";
import { formatDate, formatNumber } from "@/lib/format";

const STATUS_TONE = { DRAFT: "info", CONFIRMED: "success", CANCELLED: "danger" } as const;

export default async function StocktakeListPage() {
  const t = await getTranslations("inventory.stocktake");
  const tStatus = await getTranslations("inventory.stocktake.status");
  const result = await getStocktakes();
  const stocktakes = result.success ? result.data : [];

  return (
    <>
      <PageHeader
        title={t("listTitle")}
        breadcrumbs={[{ labelKey: "nav.inventory", href: "/inventory" }, { labelKey: "inventory.stocktake.listTitle" }]}
        actions={
          <Button asChild variant="primary" className="max-md:min-h-11">
            <Link href="/inventory/stocktake/new">
              <ClipboardPlus /> {t("newStocktake")}
            </Link>
          </Button>
        }
      />
      {stocktakes.length === 0 ? (
        <EmptyState icon={<ClipboardList className="size-6" />} title={t("listEmpty")} />
      ) : (
        <div className="flex flex-col gap-3">
          {stocktakes.map((s) => (
            <Link key={s.id} href={`/inventory/stocktake/${s.id}`}>
              <Card className="transition-colors duration-200 hover:bg-muted">
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="font-medium">#{String(s.number).padStart(4, "0")}</span>
                    <span className="text-body-sm text-muted-foreground">
                      {formatDate(s.createdAt)} · {s.createdByName} · {formatNumber(s.lineCount)} {t("linesUnit")}
                    </span>
                  </div>
                  <StatusBadge tone={STATUS_TONE[s.status]} label={tStatus(s.status)} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
