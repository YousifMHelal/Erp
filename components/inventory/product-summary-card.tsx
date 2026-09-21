import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { StockStatusBadge, stockStatusFor } from "@/components/inventory/stock-status-badge";
import { formatNumber } from "@/lib/format";
import type { ProductSummaryCardProps } from "@/types";

export function ProductSummaryCard({ product }: ProductSummaryCardProps) {
  const t = useTranslations("inventory.detail");
  const status = stockStatusFor(product.stockQty, product.minStockQty);
  const valueAtCost = product.stockQty * Number(product.avgCostPerSub);
  const sellPricePerSub = Number(product.sellPricePerBase) / product.unitsPerBase;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-h2">{product.name}</span>
            <span className="text-body-sm text-muted-foreground">
              {product.categoryName} · {product.sku}
            </span>
          </div>
          <StockStatusBadge status={status} />
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
          <Field label={t("stockQty")} value={`${formatNumber(product.stockQty)} ${product.subUnitName}`} />
          <Field label={t("avgCost")} value={<Money value={product.avgCostPerSub} />} />
          <Field label={t("sellPrice")} value={<Money value={String(sellPricePerSub)} />} />
          <Field label={t("valueAtCost")} value={<Money value={String(valueAtCost)} />} />
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
          <Field label={t("baseUnit")} value={product.baseUnitName} />
          <Field label={t("subUnit")} value={product.subUnitName} />
          <Field label={t("unitsPerBase")} value={formatNumber(product.unitsPerBase)} />
          <Field label={t("minStock")} value={`${formatNumber(product.minStockQty)} ${product.subUnitName}`} />
        </div>

        {product.notes && (
          <p className="border-t border-border pt-4 text-body-sm text-muted-foreground">{product.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
