"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Money } from "@/components/shared/money";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { InvoiceDocumentType, InvoiceListRow } from "@/types";

const PAYMENT_STATUS_TONE = { PAID: "success", PARTIAL: "warning", UNPAID: "danger" } as const;

export function useInvoiceColumns(
  documentType: InvoiceDocumentType,
  detailBasePath: string,
  t: (key: string) => string,
  tStatus: (key: string) => string,
): ColumnDef<InvoiceListRow, unknown>[] {
  const partyColumnHeader = documentType === "SALE" ? t("columnPartySale") : t("columnPartyPurchase");

  return [
    {
      accessorKey: "number",
      header: t("columnNumber"),
      cell: ({ row }) => (
        <Link
          href={`${detailBasePath}/${row.original.id}`}
          className={cn(
            "font-medium text-primary hover:underline",
            row.original.status === "CANCELLED" && "text-muted-foreground line-through",
          )}
        >
          #{String(row.original.number).padStart(6, "0")}
        </Link>
      ),
    },
    { accessorKey: "partyName", header: partyColumnHeader },
    {
      accessorKey: "issuedAt",
      header: t("columnDate"),
      cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
    },
    { accessorKey: "cashboxName", header: t("columnCashbox") },
    { accessorKey: "userName", header: t("columnUser") },
    {
      accessorKey: "total",
      header: t("columnTotal"),
      cell: ({ getValue }) => <Money value={getValue<string>()} />,
    },
    {
      accessorKey: "paymentStatus",
      header: t("columnPaymentStatus"),
      cell: ({ getValue }) => {
        const status = getValue<InvoiceListRow["paymentStatus"]>();
        return <StatusBadge tone={PAYMENT_STATUS_TONE[status]} label={tStatus(status)} />;
      },
    },
  ];
}
