"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AppTooltip } from "@/components/shared/app-tooltip";
import type { PrintLineColumnListProps } from "@/types";

export function PrintLineColumnList({ columns, onToggle, onMove }: PrintLineColumnListProps) {
  const t = useTranslations("settings.printTemplate");
  const tCommon = useTranslations("common");

  return (
    <ul className="flex flex-col gap-2">
      {columns.map((column, index) => (
        <li key={column.key} className="flex items-center gap-3 rounded-sm border border-border bg-card p-3">
          <Checkbox
            id={`print-column-${column.key}`}
            checked={column.visible}
            onCheckedChange={() => onToggle(column.key)}
            aria-label={t(column.labelKey)}
          />
          <Label htmlFor={`print-column-${column.key}`} className="flex-1 cursor-pointer font-normal">
            {t(column.labelKey)}
          </Label>
          <div className="flex items-center gap-1">
            <AppTooltip content={t("moveUp")}>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onMove(column.key, "up")}
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
                onClick={() => onMove(column.key, "down")}
                disabled={index === columns.length - 1}
                aria-label={t("moveDown")}
              >
                <ChevronDown className="size-4" />
              </Button>
            </AppTooltip>
          </div>
        </li>
      ))}
      {columns.length === 0 && <li className="text-body-sm text-muted-foreground">{tCommon("noResults")}</li>}
    </ul>
  );
}
