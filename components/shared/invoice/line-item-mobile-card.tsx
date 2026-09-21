"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/shared/money";
import { convertUnitPrice } from "@/lib/units";
import type { LineRowProps, UnitType } from "@/types";

export function LineItemMobileCard({ line, onUpdate, onRemove }: LineRowProps) {
  const t = useTranslations("invoices.form");

  function handleUnitChange(unitType: UnitType) {
    onUpdate({ unitType, unitPrice: convertUnitPrice(line.unitPrice, line.unitType, unitType, line.unitsPerBase) });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 text-body-sm font-medium">{line.productName}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label={t("removeLine")}
            className="shrink-0 text-danger-fg hover:bg-danger-bg"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted-foreground">{t("unitLabel")}</span>
            <Select value={line.unitType} onValueChange={(v) => handleUnitChange(v as UnitType)}>
              <SelectTrigger size="sm" className="w-full" aria-label={t("unitLabel")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUB">{line.subUnitName}</SelectItem>
                <SelectItem value="BASE">{line.baseUnitName}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted-foreground">{t("qtyLabel")}</span>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={line.qty}
              onChange={(e) => onUpdate({ qty: Number(e.target.value) })}
              className="text-end tabular-nums"
              aria-label={t("qtyLabel")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted-foreground">{t("priceLabel")}</span>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={line.unitPrice}
              onChange={(e) => onUpdate({ unitPrice: Number(e.target.value) })}
              className="text-end tabular-nums"
              aria-label={t("priceLabel")}
            />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-caption text-muted-foreground">{t("lineTotalLabel")}</span>
          <Money value={String(line.lineTotal)} className="font-medium" />
        </div>
      </CardContent>
    </Card>
  );
}
