"use client";

import { flexRender } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { useDataTable } from "@/components/shared/data-table/use-data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton";
import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui.store";
import type { DataTableProps, DataTableToolbarProps } from "@/types";

export function DataTable<TData>({
  columns,
  data,
  renderMobileCard,
  getRowId,
  isLoading,
  skeletonRowCount = 6,
  emptyState,
  toolbar,
  footerRow,
  enableRowSelection,
  onRowSelectionChange,
  pageCount,
  page = 1,
  onPageChange,
  totalCount,
  className,
}: DataTableProps<TData>) {
  const t = useTranslations("dataTable");
  const density = useUiStore((s) => s.density);
  const tableColumns = enableRowSelection ? [selectionColumn(), ...columns] : columns;

  const table = useDataTable({ columns: tableColumns, data, getRowId, enableRowSelection });

  if (enableRowSelection && onRowSelectionChange) {
    const selectedIds = table.getSelectedRowModel().rows.map((r) => r.id);
    onRowSelectionChange(selectedIds);
  }

  const isEmpty = !isLoading && data.length === 0;

  return (
    <div
      data-density={density}
      className={cn("flex flex-col overflow-hidden rounded-md border border-border bg-card", className)}
    >
      {toolbar}

      <div className="hidden overflow-x-auto md:block">
        {isLoading ? (
          <DataTableSkeleton columnCount={tableColumns.length} rowCount={skeletonRowCount} />
        ) : isEmpty ? (
          emptyState ?? <EmptyState title={t("noData")} />
        ) : (
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <TableHead
                        key={header.id}
                        style={{
                          height: "var(--density-row-height)",
                          paddingInline: "var(--density-cell-padding-inline)",
                        }}
                        className={cn("text-label", header.column.columnDef.meta?.className)}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === "asc" ? (
                              <ArrowUp className="size-3.5" aria-label={t("sortAscending")} />
                            ) : sorted === "desc" ? (
                              <ArrowDown className="size-3.5" aria-label={t("sortDescending")} />
                            ) : (
                              <ChevronsUpDown className="size-3.5 opacity-40" aria-hidden="true" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        height: "var(--density-row-height)",
                        paddingBlock: "var(--density-cell-padding-block)",
                        paddingInline: "var(--density-cell-padding-inline)",
                      }}
                      className={cell.column.columnDef.meta?.className}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            {footerRow}
          </Table>
        )}
      </div>

      <div className="flex flex-col gap-3 p-3 md:hidden">
        {isLoading ? (
          Array.from({ length: skeletonRowCount }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-md bg-muted" />
          ))
        ) : isEmpty ? (
          emptyState ?? <EmptyState title={t("noData")} />
        ) : (
          data.map((row) => <div key={getRowId ? getRowId(row) : JSON.stringify(row)}>{renderMobileCard(row)}</div>)
        )}
      </div>

      {pageCount !== undefined && onPageChange && (
        <DataTablePagination page={page} pageCount={pageCount} onPageChange={onPageChange} totalCount={totalCount} />
      )}
    </div>
  );
}

function selectionColumn() {
  return {
    id: "select",
    header: ({ table }: { table: { getIsAllRowsSelected: () => boolean; getIsSomeRowsSelected: () => boolean; toggleAllRowsSelected: (v: boolean) => void } }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected() ? true : table.getIsSomeRowsSelected() ? "indeterminate" : false}
        onCheckedChange={(v) => table.toggleAllRowsSelected(!!v)}
      />
    ),
    cell: ({ row }: { row: { getIsSelected: () => boolean; toggleSelected: (v: boolean) => void } }) => (
      <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} />
    ),
    enableSorting: false,
  } as never;
}

export { DataTableToolbar, DataTablePagination };
export type { DataTableToolbarProps };
export { DataTableDensityToggle } from "@/components/shared/data-table/data-table-density-toggle";
