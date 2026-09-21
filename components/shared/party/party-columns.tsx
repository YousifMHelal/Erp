"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { BalanceBadge } from "@/components/shared/party/balance-badge";
import type { PartyListRow, PartyType } from "@/types";

export function usePartyColumns(partyType: PartyType, t: (key: string) => string): ColumnDef<PartyListRow, unknown>[] {
  const detailBasePath = partyType === "CUSTOMER" ? "/customers" : "/suppliers";

  return [
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
      accessorKey: "balance",
      header: t("columnBalance"),
      cell: ({ row }) => <BalanceBadge partyType={partyType} balance={row.original.balance} />,
    },
  ];
}
