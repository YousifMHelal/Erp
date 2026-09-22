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
import { purchasesFilterToSearchParams } from "@/lib/purchases-filters";
import { toDateInputValue } from "@/lib/format";
import type {
  DateRange,
  InvoiceListRow,
  PurchasesListFilter,
  PurchasesListViewProps,
} from "@/types";

export function PurchasesListView({ result, options, filter }: PurchasesListViewProps) {
  const t = useTranslations("invoices.list");
  const tStatus = useTranslations("invoices.paymentStatus");
  const tAction = useTranslations("purchasesAction");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const columns = useInvoiceColumns("PURCHASE", "/purchases", t, tStatus);

  function applyFilter(patch: Partial<PurchasesListFilter>) {
    const next: PurchasesListFilter = {
      ...filter,
      page: 1,
      ...patch,
    };
    const search = purchasesFilterToSearchParams(next).toString();
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
      partyName: row.supplierName ?? "",
      cashboxName: row.cashboxName,
      userName: row.userName,
      total: row.total,
      paymentStatus: row.paymentStatus as InvoiceListRow["paymentStatus"],
      status: row.status as InvoiceListRow["status"],
      issuedAt: row.issuedAt,
    }));
  }, [result]);

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
        <InvoiceMobileCard invoice={row} documentType="PURCHASE" detailBasePath="/purchases" />
      )}
      page={page}
      pageCount={pageCount}
      onPageChange={(nextPage) => applyFilter({ page: nextPage })}
      totalCount={totalCount}
      pageSize={pageSize}
      emptyState={
        <EmptyState
          icon={<FileText className="size-6" />}
          title={t("emptyTitlePurchase")}
          description={t("emptyDescriptionPurchase")}
          action={
            <Button asChild variant="primary">
              <Link href="/purchases/new">
                <FilePlus2 /> {t("newInvoicePurchase")}
              </Link>
            </Button>
          }
        />
      }
      toolbar={
        <DataTableToolbar
          defaultSearchValue={filter.q ?? ""}
          onSearchChange={debouncedSearch}
          searchPlaceholder={t("searchPlaceholderPurchase")}
          filters={
            <InvoiceFilters
              documentType="PURCHASE"
              dateRange={dateRange}
              onDateRangeChange={(range) =>
                applyFilter({
                  from: toDateInputValue(range.from),
                  to: toDateInputValue(range.to),
                })
              }
              partyId={filter.supplierId}
              onPartyChange={(supplierId) => applyFilter({ supplierId })}
              partyOptions={options.suppliers.map((s) => ({ value: s.id, label: s.name }))}
              paymentStatus={filter.paymentStatus}
              onPaymentStatusChange={(paymentStatus) =>
                applyFilter({
                  paymentStatus: paymentStatus as PurchasesListFilter["paymentStatus"],
                })
              }
            />
          }
          actions={
            <>
              <DataTableDensityToggle />
              <Button asChild variant="primary">
                <Link href="/purchases/new">
                  <FilePlus2 /> {t("newInvoicePurchase")}
                </Link>
              </Button>
            </>
          }
        />
      }
    />
  );
}
