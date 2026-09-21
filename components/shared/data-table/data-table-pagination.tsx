"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { DataTablePaginationProps } from "@/types";

export function DataTablePagination({ page, pageCount, onPageChange, totalCount }: DataTablePaginationProps) {
  const t = useTranslations("dataTable");

  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2">
      <p className="text-body-sm text-muted-foreground">
        {totalCount !== undefined
          ? t("pageOfTotal", { page, pageCount, total: totalCount })
          : t("pageOf", { page, pageCount })}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t("previousPage")}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label={t("nextPage")}
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>
    </div>
  );
}
