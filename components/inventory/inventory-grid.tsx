"use client";

import { useMemo, useState } from "react";
import { Plus, PackageSearch } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
import type { InventoryGridProps, InventoryProductRow, StockStatus } from "@/types";

const PAGE_SIZE = 10;

export function InventoryGrid({ products: initialProducts, categoryOptions }: InventoryGridProps) {
  const t = useTranslations("inventory");
  const [products, setProducts] = useState<InventoryProductRow[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [stockStatus, setStockStatus] = useState<StockStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryProductRow | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<InventoryProductRow | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleSave(saved: InventoryProductRow) {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
    });
  }

  function handleEdit(product: InventoryProductRow) {
    setEditingProduct(product);
    setDialogOpen(true);
  }

  function handleDeleteRequest(product: InventoryProductRow) {
    if (product.stockQty > 0) return;
    setDeleteTarget(product);
    setDeleteOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteOpen(false);
    toast.success(t("deleteSuccess"));
    setDeleteTarget(undefined);
  }

  const columns = useInventoryColumns(t, { onEdit: handleEdit, onDelete: handleDeleteRequest });

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
        renderMobileCard={(row) => <InventoryMobileCard product={row} onEdit={handleEdit} onDelete={handleDeleteRequest} />}
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
              <Button
                variant="primary"
                onClick={() => {
                  setEditingProduct(undefined);
                  setDialogOpen(true);
                }}
              >
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
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditingProduct(undefined);
                    setDialogOpen(true);
                  }}
                >
                  <Plus /> {t("newProduct")}
                </Button>
              </>
            }
          />
        }
      />
      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingProduct(undefined);
        }}
        categoryOptions={categoryOptions}
        product={editingProduct}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteDialogTitle", { name: deleteTarget?.name ?? "" })}
        description={t("deleteDialogDescription")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
