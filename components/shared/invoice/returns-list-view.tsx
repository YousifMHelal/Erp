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
import { returnsFilterToSearchParams } from "@/lib/returns-filters";
import { toDateInputValue } from "@/lib/format";
import type { DateRange, ReturnsListFilter, ReturnsListViewProps } from "@/types";

export function ReturnsListView({
  documentType,
  result,
  partyOptions,
  filter,
  detailBasePath,
  newInvoiceHref,
}: ReturnsListViewProps) {
  const t = useTranslations("invoices.list");
  const tStatus = useTranslations("invoices.paymentStatus");
  const tReturns = useTranslations("returns");
  const tAction = useTranslations("returnsAction");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const columns = useInvoiceColumns(documentType, detailBasePath, t, tStatus);

  function applyFilter(patch: Partial<ReturnsListFilter>) {
    const next: ReturnsListFilter = { ...filter, page: 1, ...patch };
    const search = returnsFilterToSearchParams(next).toString();
    startTransition(() => {
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    });
  }

  const debouncedSearch = useDebouncedCallback(
    (value: string) => applyFilter({ q: value || undefined }),
    300,
  );

  const rows = useMemo(() => (result.success ? result.data.rows : []), [result]);

  if (!result.success) {
    return (
      <EmptyState icon={<FileText className="size-6" />} title={tAction("loadFailed")} description={result.error} />
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
        <InvoiceMobileCard invoice={row} documentType={documentType} detailBasePath={detailBasePath} />
      )}
      page={page}
      pageCount={pageCount}
      onPageChange={(nextPage) => applyFilter({ page: nextPage })}
      totalCount={totalCount}
      pageSize={pageSize}
      emptyState={<EmptyState icon={<FileText className="size-6" />} title={tReturns("listEmpty")} />}
      toolbar={
        <DataTableToolbar
          defaultSearchValue={filter.q ?? ""}
          onSearchChange={debouncedSearch}
          searchPlaceholder={t("searchPlaceholderSale")}
          filters={
            <InvoiceFilters
              documentType={documentType}
              dateRange={dateRange}
              onDateRangeChange={(range) =>
                applyFilter({ from: toDateInputValue(range.from), to: toDateInputValue(range.to) })
              }
              partyId={filter.partyId}
              onPartyChange={(partyId) => applyFilter({ partyId })}
              partyOptions={partyOptions}
              paymentStatus={undefined}
              onPaymentStatusChange={() => {}}
            />
          }
          actions={
            <>
              <DataTableDensityToggle />
              <Button asChild variant="primary">
                <Link href={newInvoiceHref}>
                  <FilePlus2 /> {tReturns("newReturnLabel")}
                </Link>
              </Button>
            </>
          }
        />
      }
    />
  );
}
