"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { DataTableToolbarProps } from "@/types";

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  actions,
}: DataTableToolbarProps) {
  const t = useTranslations("common");

  const hasSearch = onSearchChange !== undefined;

  return (
    <div className="flex flex-col gap-3 border-b border-border p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {hasSearch && (
          <InputGroup className="max-w-xs">
            <InputGroupInput
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder ?? t("search")}
              aria-label={t("search")}
            />
            <InputGroupAddon>
              <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>
        )}
        {filters}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
