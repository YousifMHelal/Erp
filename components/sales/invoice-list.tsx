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
import { InvoiceFilters } from "@/components/sales/invoice-filters";
import { InvoiceMobileCard } from "@/components/sales/invoice-mobile-card";
import { useInvoiceColumns } from "@/components/sales/invoice-columns";
import type { DateRange, InvoiceListProps } from "@/types";

const PAGE_SIZE = 10;

export function InvoiceList({ invoices, customerOptions }: InvoiceListProps) {
  const t = useTranslations("sales.list");
  const tStatus = useTranslations("invoices.paymentStatus");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const columns = useInvoiceColumns(t, tStatus);

  const filtered = useMemo(() => {
    return invoices.filter((invoice) => {
      if (search && !invoice.partyName.includes(search) && !String(invoice.number).includes(search)) return false;
      if (customerId && invoice.id !== customerId) return false;
      if (paymentStatus && invoice.paymentStatus !== paymentStatus) return false;
      return true;
    });
  }, [invoices, search, customerId, paymentStatus]);

  const pageCount = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <DataTable
      columns={columns}
      data={paged}
      getRowId={(row) => row.id}
      renderMobileCard={(row) => <InvoiceMobileCard invoice={row} />}
      page={page}
      pageCount={pageCount}
      onPageChange={setPage}
      totalCount={filtered.length}
      emptyState={
        <EmptyState
          icon={<FileText className="size-6" />}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Button asChild variant="primary">
              <Link href="/sales/new">
                <FilePlus2 /> {t("newInvoice")}
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
          searchPlaceholder={t("searchPlaceholder")}
          filters={
            <InvoiceFilters
              search={search}
              onSearchChange={setSearch}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              customerId={customerId}
              onCustomerChange={setCustomerId}
              customerOptions={customerOptions}
              paymentStatus={paymentStatus}
              onPaymentStatusChange={setPaymentStatus}
            />
          }
          actions={
            <>
              <DataTableDensityToggle />
              <Button asChild variant="primary">
                <Link href="/sales/new">
                  <FilePlus2 /> {t("newInvoice")}
                </Link>
              </Button>
            </>
          }
        />
      }
    />
  );
}
