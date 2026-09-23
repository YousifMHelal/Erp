"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { BalanceBadge } from "@/components/shared/party/balance-badge";
import { PartyRowActions } from "@/components/shared/party/party-row-actions";
import type { PartyListRow, PartyType } from "@/types";

export function usePartyColumns(
  partyType: PartyType,
  t: (key: string) => string,
  onEdit: (party: PartyListRow) => void,
  onDelete: (party: PartyListRow) => void,
): ColumnDef<PartyListRow, unknown>[] {
  const detailBasePath = partyType === "CUSTOMER" ? "/customers" : "/suppliers";

  return [
    {
      id: "rowNumber",
      header: t("columnNumber"),
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.index + 1}</span>,
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: t("columnName"),
      cell: ({ row }) => (
        <Link href={`${detailBasePath}/${row.original.id}`} className="font-medium text-primary hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "phone",
      header: t("columnPhone"),
      cell: ({ getValue }) => <span className="tabular-nums" dir="ltr">{getValue<string>() || "—"}</span>,
    },
    {
      accessorKey: "address",
      header: t("columnAddress"),
      cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>() || "—"}</span>,
    },
    {
      accessorKey: "balance",
      header: t("columnBalance"),
      cell: ({ row }) => <BalanceBadge partyType={partyType} balance={row.original.balance} />,
    },
    {
      id: "actions",
      header: t("columnActions"),
      meta: { className: "text-end" },
      enableSorting: false,
      cell: ({ row }) => (
        <PartyRowActions partyType={partyType} party={row.original} onEdit={onEdit} onDelete={onDelete} />
      ),
    },
  ];
}
