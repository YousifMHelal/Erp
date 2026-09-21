"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Money } from "@/components/shared/money";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MoneyDocumentRow } from "@/types";

export function useMoneyDocumentColumns(t: (key: string) => string): ColumnDef<MoneyDocumentRow, unknown>[] {
  return [
    {
      accessorKey: "number",
      header: t("columnNumber"),
      cell: ({ row }) => (
        <span className={cn("font-medium", row.original.status === "CANCELLED" && "text-muted-foreground line-through")}>
          #{String(row.original.number).padStart(5, "0")}
        </span>
      ),
    },
    { accessorKey: "partyName", header: t("columnParty") },
    {
      accessorKey: "occurredAt",
      header: t("columnDate"),
      cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
    },
    { accessorKey: "cashboxName", header: t("columnCashbox") },
    {
      accessorKey: "amount",
      header: t("columnAmount"),
      cell: ({ getValue }) => <Money value={getValue<string>()} />,
    },
  ];
}
