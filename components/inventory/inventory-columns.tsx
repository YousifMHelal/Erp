"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/shared/app-tooltip";
import { Money } from "@/components/shared/money";
import { StockStatusBadge, stockStatusFor } from "@/components/inventory/stock-status-badge";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { InventoryProductRow } from "@/types";

type InventoryColumnsOptions = {
  onEdit: (product: InventoryProductRow) => void;
  onDelete: (product: InventoryProductRow) => void;
};

export function useInventoryColumns(
  t: (key: string) => string,
  { onEdit, onDelete }: InventoryColumnsOptions,
): ColumnDef<InventoryProductRow, unknown>[] {
  return [
    {
      id: "rowNumber",
      header: t("columnNumber"),
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.index + 1}</span>,
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: t("columnProduct"),
      cell: ({ row }) => (
        <Link
          href={`/inventory/${row.original.id}`}
          className={cn("font-medium text-primary hover:underline", !row.original.isActive && "text-muted-foreground")}
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "categoryName",
      header: t("columnCategory"),
      meta: { className: "hidden xl:table-cell" },
    },
    {
      accessorKey: "stockQty",
      header: t("columnStockQty"),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatNumber(row.original.stockQty / row.original.unitsPerBase, 1)} {row.original.baseUnitName}
        </span>
      ),
    },
    {
      accessorKey: "avgCostPerSub",
      header: t("columnAvgCost"),
      cell: ({ row }) => <Money value={String(Number(row.original.avgCostPerSub) * row.original.unitsPerBase)} />,
      meta: { className: "hidden 2xl:table-cell" },
    },
    {
      id: "sellPricePerSub",
      header: t("columnSellPrice"),
      cell: ({ row }) => <Money value={row.original.sellPricePerBase} />,
    },
    {
      id: "valueAtCost",
      header: t("columnValueAtCost"),
      cell: ({ row }) => <Money value={String(row.original.stockQty * Number(row.original.avgCostPerSub))} />,
      meta: { className: "hidden xl:table-cell" },
    },
    {
      id: "stockStatus",
      header: t("columnStatus"),
      cell: ({ row }) => (
        <StockStatusBadge status={stockStatusFor(row.original.stockQty, row.original.minStockQty)} />
      ),
    },
    {
      id: "actions",
      header: t("columnActions"),
      meta: { className: "text-end" },
      cell: ({ row }) => {
        const product = row.original;
        const canDelete = product.stockQty <= 0;
        return (
          <div className="flex items-center justify-end gap-1">
            <AppTooltip content={t("editAction")}>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => onEdit(product)} aria-label={t("editAction")}>
                <Pencil className="size-4" />
              </Button>
            </AppTooltip>
            <AppTooltip content={canDelete ? t("deleteAction") : t("deleteBlockedTooltip")}>
              <span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={!canDelete}
                  onClick={() => onDelete(product)}
                  aria-label={t("deleteAction")}
                  className="text-danger-fg hover:text-danger-fg"
                >
                  <Trash2 className="size-4" />
                </Button>
              </span>
            </AppTooltip>
          </div>
        );
      },
    },
  ];
}
