"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilePlus2, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableDensityToggle } from "@/components/shared/data-table/data-table-density-toggle";
import { EmptyState } from "@/components/shared/empty-state";
import { InvoiceFilters } from "@/components/shared/invoice/invoice-filters";
import { InvoiceMobileCard } from "@/components/shared/invoice/invoice-mobile-card";
import { useInvoiceColumns } from "@/components/shared/invoice/invoice-columns";
import type { DateRange, InvoiceListProps } from "@/types";

const PAGE_SIZE = 10;

export function InvoiceList({ documentType, invoices, partyOptions, newInvoiceHref }: InvoiceListProps) {
  const t = useTranslations("invoices.list");
  const tStatus = useTranslations("invoices.paymentStatus");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [partyId, setPartyId] = useState<string | undefined>(undefined);
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const columns = useInvoiceColumns(documentType, t, tStatus);

  const filtered = useMemo(() => {
    return invoices.filter((invoice) => {
      if (search && !invoice.partyName.includes(search) && !String(invoice.number).includes(search)) return false;
      if (partyId && invoice.id !== partyId) return false;
      if (paymentStatus && invoice.paymentStatus !== paymentStatus) return false;
      return true;
    });
  }, [invoices, search, partyId, paymentStatus]);

  const pageCount = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const newInvoiceLabel = documentType === "SALE" ? t("newInvoiceSale") : t("newInvoicePurchase");
  const emptyTitle = documentType === "SALE" ? t("emptyTitleSale") : t("emptyTitlePurchase");
  const emptyDescription = documentType === "SALE" ? t("emptyDescriptionSale") : t("emptyDescriptionPurchase");
  const searchPlaceholder = documentType === "SALE" ? t("searchPlaceholderSale") : t("searchPlaceholderPurchase");

  return (
    <DataTable
      columns={columns}
      data={paged}
      getRowId={(row) => row.id}
      renderMobileCard={(row) => <InvoiceMobileCard invoice={row} documentType={documentType} />}
      page={page}
      pageCount={pageCount}
      onPageChange={setPage}
      totalCount={filtered.length}
      emptyState={
        <EmptyState
          icon={<FileText className="size-6" />}
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Button asChild variant="primary">
              <Link href={newInvoiceHref}>
                <FilePlus2 /> {newInvoiceLabel}
              </Link>
            </Button>
          }
        />
      }
      toolbar={
        <DataTableToolbar
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder={searchPlaceholder}
          filters={
            <InvoiceFilters
              documentType={documentType}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              partyId={partyId}
              onPartyChange={setPartyId}
              partyOptions={partyOptions}
              paymentStatus={paymentStatus}
              onPaymentStatusChange={setPaymentStatus}
            />
          }
          actions={
            <>
              <DataTableDensityToggle />
              <Button asChild variant="primary">
                <Link href={newInvoiceHref}>
                  <FilePlus2 /> {newInvoiceLabel}
                </Link>
              </Button>
            </>
          }
        />
      }
    />
  );
}
