"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Money } from "@/components/shared/money";
import { StockStatusBadge, stockStatusFor } from "@/components/inventory/stock-status-badge";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { InventoryProductRow } from "@/types";

export function useInventoryColumns(t: (key: string) => string): ColumnDef<InventoryProductRow, unknown>[] {
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
  ];
}
