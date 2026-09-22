"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { salesFilterToSearchParams } from "@/lib/sales-filters";
import { toDateInputValue } from "@/lib/format";
import type {
  DateRange,
  InvoiceListRow,
  SalesListFilter,
  SalesListViewProps,
} from "@/types";

export function SalesListView({ result, options, filter }: SalesListViewProps) {
  const t = useTranslations("invoices.list");
  const tStatus = useTranslations("invoices.paymentStatus");
  const tAction = useTranslations("salesAction");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const columns = useInvoiceColumns("SALE", "/sales", t, tStatus);

  /** Replaces the URL — the server re-runs `getSales` with the new filter. */
  function applyFilter(patch: Partial<SalesListFilter>) {
    // Any filter change resets to page 1 unless the change *is* the page.
    const next: SalesListFilter = {
      ...filter,
      page: 1,
      ...patch,
    };
    const search = salesFilterToSearchParams(next).toString();
    startTransition(() => {
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    });
  }

  const debouncedSearch = useDebouncedCallback(
    (value: string) => applyFilter({ q: value || undefined }),
    300,
  );

  const rows: InvoiceListRow[] = useMemo(() => {
    if (!result.success) return [];
    return result.data.rows.map((row) => ({
      id: row.id,
      number: row.number,
      // A walk-in sale has no customer; the list still needs a label.
      partyName: row.customerName ?? t("walkInCustomer"),
      cashboxName: row.cashboxName,
      userName: row.cashierName,
      total: row.total,
      paymentStatus: row.paymentStatus as InvoiceListRow["paymentStatus"],
      status: row.status as InvoiceListRow["status"],
      issuedAt: row.issuedAt,
    }));
  }, [result, t]);

  if (!result.success) {
    return (
      <EmptyState
        icon={<FileText className="size-6" />}
        title={tAction("loadFailed")}
        description={result.error}
      />
    );
  }

  const { totalCount, page, pageSize } = result.data;
  const pageCount = Math.max(Math.ceil(totalCount / pageSize), 1);

  const dateRange: DateRange = {
    from: filter.from ? new Date(`${filter.from}T00:00:00`) : undefined,
    to: filter.to ? new Date(`${filter.to}T00:00:00`) : undefined,
  };

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isPending}
      getRowId={(row) => row.id}
      renderMobileCard={(row) => (
        <InvoiceMobileCard invoice={row} documentType="SALE" detailBasePath="/sales" />
      )}
      page={page}
      pageCount={pageCount}
      onPageChange={(nextPage) => applyFilter({ page: nextPage })}
      totalCount={totalCount}
      pageSize={pageSize}
      emptyState={
        <EmptyState
          icon={<FileText className="size-6" />}
          title={t("emptyTitleSale")}
          description={t("emptyDescriptionSale")}
          action={
            <Button asChild variant="primary">
              <Link href="/sales/new">
                <FilePlus2 /> {t("newInvoiceSale")}
              </Link>
            </Button>
          }
        />
      }
      toolbar={
        <DataTableToolbar
          defaultSearchValue={filter.q ?? ""}
          onSearchChange={debouncedSearch}
          searchPlaceholder={t("searchPlaceholderSale")}
          filters={
            <InvoiceFilters
              documentType="SALE"
              dateRange={dateRange}
              onDateRangeChange={(range) =>
                applyFilter({
                  from: toDateInputValue(range.from),
                  to: toDateInputValue(range.to),
                })
              }
              partyId={filter.customerId}
              onPartyChange={(customerId) => applyFilter({ customerId })}
              partyOptions={options.customers.map((c) => ({ value: c.id, label: c.name }))}
              paymentStatus={filter.paymentStatus}
              onPaymentStatusChange={(paymentStatus) =>
                applyFilter({
                  paymentStatus: paymentStatus as SalesListFilter["paymentStatus"],
                })
              }
            />
          }
          actions={
            <>
              <DataTableDensityToggle />
              <Button asChild variant="primary">
                <Link href="/sales/new">
                  <FilePlus2 /> {t("newInvoiceSale")}
                </Link>
              </Button>
            </>
          }
        />
      }
    />
  );
}
