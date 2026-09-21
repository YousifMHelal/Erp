"use client";

import { useTranslations } from "next-intl";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InventoryFiltersProps, StockStatus } from "@/types";

export function InventoryFilters({
  categoryOptions,
  categoryId,
  onCategoryChange,
  stockStatus,
  onStockStatusChange,
}: InventoryFiltersProps) {
  const t = useTranslations("inventory");
  const tStatus = useTranslations("inventory.stockStatus");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <EntityCombobox
        options={categoryOptions}
        value={categoryId}
        onChange={onCategoryChange}
        placeholder={t("allCategories")}
        className="w-full sm:w-48"
      />
      <Select
        value={stockStatus ?? "ALL"}
        onValueChange={(v) => onStockStatusChange(v === "ALL" ? undefined : (v as StockStatus))}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label={t("stockStatusFilterLabel")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
          <SelectItem value="IN_STOCK">{tStatus("IN_STOCK")}</SelectItem>
          <SelectItem value="LOW_STOCK">{tStatus("LOW_STOCK")}</SelectItem>
          <SelectItem value="OUT_OF_STOCK">{tStatus("OUT_OF_STOCK")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
