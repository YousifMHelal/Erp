import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { StockStatusBadge, stockStatusFor } from "@/components/inventory/stock-status-badge";
import { formatNumber } from "@/lib/format";
import { useTranslations } from "next-intl";
import type { InventoryProductRow } from "@/types";

export function InventoryMobileCard({ product }: { product: InventoryProductRow }) {
  const t = useTranslations("inventory");

  return (
    <Link href={`/inventory/${product.id}`}>
      <Card className={!product.isActive ? "opacity-60" : undefined}>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{product.name}</span>
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
        </CardContent>
      </Card>
    </Link>
  );
}
