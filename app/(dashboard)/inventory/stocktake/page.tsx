import Link from "next/link";
import { ClipboardPlus, ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatNumber } from "@/lib/format";
import type { StocktakeListRow } from "@/types";

const STOCKTAKES: StocktakeListRow[] = [
  { id: "1", number: 4, status: "CONFIRMED", lineCount: 12, totalDifference: -3, createdByName: "أحمد سعيد", createdAt: "2026-09-10" },
  { id: "2", number: 3, status: "CONFIRMED", lineCount: 8, totalDifference: 1, createdByName: "منى فتحي", createdAt: "2026-08-15" },
];

const STATUS_TONE = { DRAFT: "info", CONFIRMED: "success", CANCELLED: "danger" } as const;

export default function StocktakeListPage() {
  const t = useTranslations("inventory.stocktake");
  const tStatus = useTranslations("inventory.stocktake.status");

  return (
    <>
      <PageHeader
        title={t("listTitle")}
        breadcrumbs={[{ labelKey: "nav.inventory", href: "/inventory" }, { labelKey: "inventory.stocktake.listTitle" }]}
        actions={
          <Button asChild variant="primary">
            <Link href="/inventory/stocktake/new">
              <ClipboardPlus /> {t("newStocktake")}
            </Link>
          </Button>
        }
      />
      {STOCKTAKES.length === 0 ? (
        <EmptyState icon={<ClipboardList className="size-6" />} title={t("listEmpty")} />
      ) : (
        <div className="flex flex-col gap-3">
          {STOCKTAKES.map((s) => (
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
