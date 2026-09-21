"use client";

import { useMemo, useState } from "react";
import { Plus, PackageSearch } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableDensityToggle } from "@/components/shared/data-table/data-table-density-toggle";
import { EmptyState } from "@/components/shared/empty-state";
import { InventoryFilters } from "@/components/inventory/inventory-filters";
import { InventoryMobileCard } from "@/components/inventory/inventory-mobile-card";
import { InventoryValueSummary } from "@/components/inventory/inventory-value-summary";
import { ProductFormDialog } from "@/components/inventory/product-form-dialog";
import { useInventoryColumns } from "@/components/inventory/inventory-columns";
import { stockStatusFor } from "@/components/inventory/stock-status-badge";
import type { InventoryGridProps, StockStatus } from "@/types";

const PAGE_SIZE = 10;

export function InventoryGrid({ products, categoryOptions }: InventoryGridProps) {
  const t = useTranslations("inventory");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [stockStatus, setStockStatus] = useState<StockStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  const columns = useInventoryColumns(t);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      if (search && !product.name.includes(search) && !product.sku.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      // Category options use the category name as their value until P3's schema gives categories a real id.
      if (categoryId && product.categoryName !== categoryId) return false;
      if (stockStatus && stockStatusFor(product.stockQty, product.minStockQty) !== stockStatus) return false;
      return true;
    });
  }, [products, search, categoryId, stockStatus]);

  const summary = useMemo(() => {
    const totalCostValue = products.reduce((sum, p) => sum + p.stockQty * Number(p.avgCostPerSub), 0);
    const totalSaleValue = products.reduce(
      (sum, p) => sum + p.stockQty * (Number(p.sellPricePerBase) / p.unitsPerBase),
      0,
    );
    const lowStockCount = products.filter((p) => stockStatusFor(p.stockQty, p.minStockQty) === "LOW_STOCK").length;
    const outOfStockCount = products.filter((p) => stockStatusFor(p.stockQty, p.minStockQty) === "OUT_OF_STOCK").length;
    return {
      totalCostValue: String(totalCostValue),
      totalSaleValue: String(totalSaleValue),
      productCount: products.length,
      lowStockCount,
      outOfStockCount,
    };
  }, [products]);

  const pageCount = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <InventoryValueSummary {...summary} />
      <DataTable
        columns={columns}
        data={paged}
        getRowId={(row) => row.id}
        renderMobileCard={(row) => <InventoryMobileCard product={row} />}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        totalCount={filtered.length}
        emptyState={
          <EmptyState
            icon={<PackageSearch className="size-6" />}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={
              <Button variant="primary" onClick={() => setDialogOpen(true)}>
                <Plus /> {t("newProduct")}
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
              <InventoryFilters
                categoryOptions={categoryOptions}
                categoryId={categoryId}
                onCategoryChange={setCategoryId}
                stockStatus={stockStatus}
                onStockStatusChange={setStockStatus}
              />
            }
            actions={
              <>
                <DataTableDensityToggle />
                <Button variant="primary" onClick={() => setDialogOpen(true)}>
                  <Plus /> {t("newProduct")}
                </Button>
              </>
            }
          />
        }
      />
      <ProductFormDialog open={dialogOpen} onOpenChange={setDialogOpen} categoryOptions={categoryOptions} />
    </div>
  );
}
