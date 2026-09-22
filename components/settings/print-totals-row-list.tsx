"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AppTooltip } from "@/components/shared/app-tooltip";
import type { PrintTotalsRowListProps } from "@/types";

export function PrintTotalsRowList({ rows, onToggle, onMove, onUpdateLabel }: PrintTotalsRowListProps) {
  const t = useTranslations("settings.printTemplate");
  const tCommon = useTranslations("common");

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row, index) => {
        const defaultLabel = t(row.labelKey);
        return (
          <li key={row.key} className="flex items-center gap-3 rounded-sm border border-border bg-card p-3">
            <Checkbox
              id={`print-totals-row-${row.key}`}
              checked={row.visible}
              onCheckedChange={() => onToggle(row.key)}
              aria-label={defaultLabel}
            />
            <Input
              value={row.label}
              onChange={(e) => onUpdateLabel(row.key, e.target.value)}
              placeholder={defaultLabel}
              className="flex-1"
              aria-label={defaultLabel}
            />
            <div className="flex items-center gap-1">
              <AppTooltip content={t("moveUp")}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onMove(row.key, "up")}
                  disabled={index === 0}
                  aria-label={t("moveUp")}
                >
                  <ChevronUp className="size-4" />
                </Button>
              </AppTooltip>
              <AppTooltip content={t("moveDown")}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onMove(row.key, "down")}
                  disabled={index === rows.length - 1}
                  aria-label={t("moveDown")}
                >
                  <ChevronDown className="size-4" />
                </Button>
              </AppTooltip>
            </div>
          </li>
        );
      })}
      {rows.length === 0 && <li className="text-body-sm text-muted-foreground">{tCommon("noResults")}</li>}
    </ul>
  );
}
