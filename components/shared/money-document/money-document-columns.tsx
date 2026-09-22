"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Money } from "@/components/shared/money";
import { MoneyDocumentRowActions } from "@/components/shared/money-document/money-document-row-actions";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MoneyDocumentRow, MoneyDocumentType } from "@/types";

export function useMoneyDocumentColumns(
  documentType: MoneyDocumentType,
  t: (key: string) => string,
  onCancel: (document: MoneyDocumentRow) => void,
): ColumnDef<MoneyDocumentRow, unknown>[] {
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
    {
      id: "actions",
      header: t("columnActions"),
      enableSorting: false,
      cell: ({ row }) => (
        <MoneyDocumentRowActions documentType={documentType} document={row.original} onCancel={onCancel} />
      ),
    },
  ];
}
