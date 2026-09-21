import Link from "next/link";
import { PackageX } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatNumber } from "@/lib/format";
import type { LowStockPanelProps } from "@/types";

export function LowStockPanel({ items }: LowStockPanelProps) {
  const t = useTranslations("dashboard");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("lowStockTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {items.length === 0 ? (
          <EmptyState icon={<PackageX className="size-6" />} title={t("lowStockEmpty")} />
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/inventory/${item.id}`}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-2 transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="truncate text-body-sm font-medium">{item.name}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="tabular-nums text-body-sm text-muted-foreground">
                  {formatNumber(item.stockQty)} {item.unitName}
                </span>
                <StatusBadge tone={item.stockQty <= 0 ? "danger" : "warning"} label={item.stockQty <= 0 ? t("outOfStock") : t("lowStock")} />
              </span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
