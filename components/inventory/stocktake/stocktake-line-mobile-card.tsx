"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StocktakeLineRowProps, UnitType } from "@/types";

export function StocktakeLineMobileCard({ line, onUpdateCounted }: StocktakeLineRowProps) {
  const t = useTranslations("inventory.stocktake");
  const tForm = useTranslations("invoices.form");
  const [unitType, setUnitType] = useState<UnitType>("BASE");
  const difference = line.countedQty === null ? null : line.countedQty - line.systemQty;

  const toDisplay = (subQty: number) => (unitType === "BASE" ? subQty / line.unitsPerBase : subQty);
  const fromDisplay = (displayQty: number) => (unitType === "BASE" ? displayQty * line.unitsPerBase : displayQty);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium">{line.productName}</span>
          <Select value={unitType} onValueChange={(v) => setUnitType(v as UnitType)}>
            <SelectTrigger size="sm" className="w-20" aria-label={tForm("unitLabel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SUB">{line.subUnitName}</SelectItem>
              <SelectItem value="BASE">{line.baseUnitName}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted-foreground">
              {t("columnSystem")}
            </span>
            <span className="tabular-nums">
              {formatNumber(toDisplay(line.systemQty))}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted-foreground">
              {t("columnCounted")}
            </span>
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
              className="border-accent/40 bg-accent/5 focus-visible:border-accent h-7 w-28 border-2 text-end text-sm font-semibold tabular-nums"
              aria-label={t("columnCounted")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted-foreground">
              {t("columnDifference")}
            </span>
            <span
              className={cn(
                "font-medium tabular-nums",
                difference === null || difference === 0
                  ? "text-muted-foreground"
                  : difference > 0
                    ? "text-success-fg"
                    : "text-danger-fg",
              )}
            >
              {difference === null
                ? "—"
                : `${difference > 0 ? "+" : ""}${formatNumber(toDisplay(difference))}`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
