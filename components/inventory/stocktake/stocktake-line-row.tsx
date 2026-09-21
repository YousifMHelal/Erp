import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StocktakeLineRowProps } from "@/types";

export function StocktakeLineRow({ line, onUpdateCounted }: StocktakeLineRowProps) {
  const t = useTranslations("inventory.stocktake");
  const difference = line.countedQty === null ? null : line.countedQty - line.systemQty;

  return (
    <TableRow>
      <TableCell className="font-medium">{line.productName}</TableCell>
      <TableCell>{line.unitName}</TableCell>
      <TableCell className="tabular-nums">{formatNumber(line.systemQty)}</TableCell>
      <TableCell>
        <Input
          type="number"
          inputMode="decimal"
          step="any"
          value={line.countedQty ?? ""}
          onChange={(e) => onUpdateCounted(e.target.value === "" ? null : Number(e.target.value))}
          placeholder={t("countedPlaceholder")}
          className="h-11 w-28 border-2 border-accent/40 bg-accent/5 text-end text-h3 tabular-nums focus-visible:border-accent"
          aria-label={t("columnCounted")}
        />
      </TableCell>
      <TableCell
        className={cn(
          "text-end tabular-nums font-medium",
          difference === null ? "text-muted-foreground" : difference === 0 ? "text-muted-foreground" : difference > 0 ? "text-success-fg" : "text-danger-fg",
        )}
      >
        {difference === null ? "—" : `${difference > 0 ? "+" : ""}${formatNumber(difference)}`}
      </TableCell>
    </TableRow>
  );
}
