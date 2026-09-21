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
    { accessorKey: "categoryName", header: t("columnCategory") },
    {
      accessorKey: "stockQty",
      header: t("columnStockQty"),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatNumber(row.original.stockQty)} {row.original.subUnitName}
        </span>
      ),
    },
    {
      accessorKey: "avgCostPerSub",
      header: t("columnAvgCost"),
      cell: ({ getValue }) => <Money value={getValue<string>()} />,
    },
    {
      id: "sellPricePerSub",
      header: t("columnSellPrice"),
      cell: ({ row }) => <Money value={String(Number(row.original.sellPricePerBase) / row.original.unitsPerBase)} />,
    },
    {
      id: "valueAtCost",
      header: t("columnValueAtCost"),
      cell: ({ row }) => <Money value={String(row.original.stockQty * Number(row.original.avgCostPerSub))} />,
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
      header: "",
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
