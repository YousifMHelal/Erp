import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppTooltip } from "@/components/shared/app-tooltip";
import { Money } from "@/components/shared/money";
import { StockStatusBadge, stockStatusFor } from "@/components/inventory/stock-status-badge";
import { formatNumber } from "@/lib/format";
import type { InventoryMobileCardProps } from "@/types";

export function InventoryMobileCard({ product, onEdit, onDelete }: InventoryMobileCardProps) {
  const t = useTranslations("inventory");
  const canDelete = product.stockQty <= 0;

  return (
    <Card className={!product.isActive ? "opacity-60" : undefined}>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/inventory/${product.id}`} className="font-medium hover:underline">
            {product.name}
          </Link>
          <StockStatusBadge status={stockStatusFor(product.stockQty, product.minStockQty)} />
        </div>
        <span className="text-body-sm text-muted-foreground">{product.categoryName}</span>
        <div className="grid grid-cols-2 gap-2 border-t border-border pt-2 text-body-sm">
          <div className="flex flex-col">
            <span className="text-caption text-muted-foreground">{t("columnStockQty")}</span>
            <span className="tabular-nums">
              {formatNumber(product.stockQty)} {product.subUnitName}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-caption text-muted-foreground">{t("columnAvgCost")}</span>
            <Money value={product.avgCostPerSub} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-1 border-t border-border pt-2">
          <AppTooltip content={t("editAction")}>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => onEdit(product)} aria-label={t("editAction")}>
              <Pencil className="size-4" />
            </Button>
          </AppTooltip>
          <AppTooltip content={canDelete ? t("deleteAction") : t("deleteBlockedTooltip")}>
            <span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!canDelete}
                onClick={() => onDelete(product)}
                aria-label={t("deleteAction")}
                className="text-danger-fg hover:text-danger-fg"
              >
                <Trash2 className="size-4" />
              </Button>
            </span>
          </AppTooltip>
        </div>
      </CardContent>
    </Card>
  );
}
