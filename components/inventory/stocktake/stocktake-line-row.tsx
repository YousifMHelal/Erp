"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StocktakeLineRowProps, UnitType } from "@/types";

export function StocktakeLineRow({ line, onUpdateCounted }: StocktakeLineRowProps) {
  const t = useTranslations("inventory.stocktake");
  const tForm = useTranslations("invoices.form");
  const [unitType, setUnitType] = useState<UnitType>("SUB");
  const difference = line.countedQty === null ? null : line.countedQty - line.systemQty;

  const toDisplay = (subQty: number) => (unitType === "BASE" ? subQty / line.unitsPerBase : subQty);
  const fromDisplay = (displayQty: number) => (unitType === "BASE" ? displayQty * line.unitsPerBase : displayQty);

  return (
    <TableRow>
      <TableCell className="py-1 font-medium">{line.productName}</TableCell>
      <TableCell className="py-1">
        <Select value={unitType} onValueChange={(v) => setUnitType(v as UnitType)}>
          <SelectTrigger size="sm" className="w-20" aria-label={tForm("unitLabel")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SUB">{line.subUnitName}</SelectItem>
            <SelectItem value="BASE">{line.baseUnitName}</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="py-1 tabular-nums">
        {formatNumber(toDisplay(line.systemQty))}
      </TableCell>
      <TableCell className="py-1">
        <Input
          type="number"
          inputMode="decimal"
          step="any"
          value={line.countedQty === null ? "" : toDisplay(line.countedQty)}
          onChange={(e) =>
            onUpdateCounted(
              e.target.value === "" ? null : fromDisplay(Number(e.target.value)),
            )
          }
          placeholder={t("countedPlaceholder")}
          className="border-accent/40 bg-accent/5 focus-visible:border-accent h-7 w-24 border-2 text-end text-sm font-semibold tabular-nums"
          aria-label={t("columnCounted")}
        />
      </TableCell>
      <TableCell
        className={cn(
          "py-1 text-end font-medium tabular-nums",
          difference === null
            ? "text-muted-foreground"
            : difference === 0
              ? "text-muted-foreground"
              : difference > 0
                ? "text-success-fg"
                : "text-danger-fg",
        )}
      >
        {difference === null
          ? "—"
          : `${difference > 0 ? "+" : ""}${formatNumber(toDisplay(difference))}`}
      </TableCell>
    </TableRow>
  );
}
