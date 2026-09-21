import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StocktakeLineRowProps } from "@/types";

export function StocktakeLineMobileCard({ line, onUpdateCounted }: StocktakeLineRowProps) {
  const t = useTranslations("inventory.stocktake");
  const difference = line.countedQty === null ? null : line.countedQty - line.systemQty;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <span className="font-medium">{line.productName}</span>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted-foreground">{t("columnSystem")}</span>
            <span className="tabular-nums">
              {formatNumber(line.systemQty)} {line.unitName}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted-foreground">{t("columnCounted")}</span>
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              value={line.countedQty ?? ""}
              onChange={(e) => onUpdateCounted(e.target.value === "" ? null : Number(e.target.value))}
              placeholder={t("countedPlaceholder")}
              className="h-11 border-2 border-accent/40 bg-accent/5 text-end text-h3 tabular-nums focus-visible:border-accent"
              aria-label={t("columnCounted")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted-foreground">{t("columnDifference")}</span>
            <span
              className={cn(
                "tabular-nums font-medium",
                difference === null || difference === 0
                  ? "text-muted-foreground"
                  : difference > 0
                    ? "text-success-fg"
                    : "text-danger-fg",
              )}
            >
              {difference === null ? "—" : `${difference > 0 ? "+" : ""}${formatNumber(difference)}`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
