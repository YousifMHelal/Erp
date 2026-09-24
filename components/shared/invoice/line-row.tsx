"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/shared/app-tooltip";
import { formatMoney } from "@/lib/format";
import { convertUnitPrice } from "@/lib/units";
import { cn } from "@/lib/utils";
import type { LineRowProps, UnitType } from "@/types";

export function LineRow({ line, isActive, onUpdate, onRemove }: LineRowProps) {
  const t = useTranslations("invoices.form");

  function handleUnitChange(unitType: UnitType) {
    onUpdate({ unitType, unitPrice: convertUnitPrice(line.unitPrice, line.unitType, unitType, line.unitsPerBase) });
  }

  return (
    <TableRow data-state={isActive ? "selected" : undefined} className={cn(isActive && "bg-indigo-50 dark:bg-indigo-900/25")}>
      <TableCell
        className="w-full max-w-0"
        style={{
          paddingBlock: "var(--density-cell-padding-block)",
          paddingInline: "var(--density-cell-padding-inline)",
        }}
      >
        <span className="line-clamp-1 font-medium" title={line.productName}>
          {line.productName}
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Select value={line.unitType} onValueChange={(v) => handleUnitChange(v as UnitType)}>
          <SelectTrigger size="sm" className="w-20" aria-label={t("unitLabel")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SUB">{line.subUnitName}</SelectItem>
            <SelectItem value="BASE">{line.baseUnitName}</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={line.qty}
          onChange={(e) => onUpdate({ qty: Number(e.target.value) })}
          className="w-16 text-end tabular-nums"
          aria-label={t("qtyLabel")}
        />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={line.unitPrice}
          onChange={(e) => onUpdate({ unitPrice: Number(e.target.value) })}
          className="w-28 text-end tabular-nums"
          aria-label={t("priceLabel")}
        />
      </TableCell>
      <TableCell className="whitespace-nowrap text-end font-medium tabular-nums">
        {formatMoney(String(line.lineTotal))}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <AppTooltip content={t("removeLine")}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label={t("removeLine")}
            className="text-danger-fg hover:bg-danger-bg"
          >
            <Trash2 className="size-4" />
          </Button>
        </AppTooltip>
      </TableCell>
    </TableRow>
  );
}
