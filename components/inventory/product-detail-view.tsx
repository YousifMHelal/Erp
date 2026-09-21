"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { AppTooltip } from "@/components/shared/app-tooltip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ProductFormDialog } from "@/components/inventory/product-form-dialog";
import { ProductSummaryCard } from "@/components/inventory/product-summary-card";
import { StockMovementTable } from "@/components/inventory/stock-movement-table";
import { ProductPriceHistory } from "@/components/inventory/product-price-history";
import type { InventoryProductRow, ProductDetail, ProductDetailViewProps } from "@/types";

export function ProductDetailView({ product: initialProduct, movements, priceHistory, categoryOptions }: ProductDetailViewProps) {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [product, setProduct] = useState<ProductDetail>(initialProduct);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canDelete = product.stockQty <= 0;

  function handleSave(saved: InventoryProductRow) {
    setProduct((prev) => ({ ...prev, ...saved }));
  }

  function handleDeleteConfirm() {
    setDeleteOpen(false);
    toast.success(t("deleteSuccess"));
    router.push("/inventory");
    // Phase 2: local-only. P5-3 wires this to the real inventory.actions.ts delete.
  }

  return (
    <>
      <PageHeader
        title={product.name}
        breadcrumbs={[{ labelKey: "nav.inventory", href: "/inventory" }, { labelKey: "inventory.detail.breadcrumb" }]}
        actions={
          <>
            <Button type="button" variant="outline" className="max-md:min-h-11" onClick={() => setEditOpen(true)}>
              <Pencil /> {tCommon("edit")}
            </Button>
            <AppTooltip content={canDelete ? t("deleteAction") : t("deleteBlockedTooltip")}>
              <span>
                <Button
                  type="button"
                  variant="destructive"
                  className="max-md:min-h-11"
                  disabled={!canDelete}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 /> {tCommon("delete")}
                </Button>
              </span>
            </AppTooltip>
          </>
        }
      />
      <div className="flex flex-col gap-4">
        <ProductSummaryCard product={product} />
        <StockMovementTable movements={movements} />
        <ProductPriceHistory entries={priceHistory} />
      </div>

      <ProductFormDialog open={editOpen} onOpenChange={setEditOpen} categoryOptions={categoryOptions} product={product} onSave={handleSave} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteDialogTitle", { name: product.name })}
        description={t("deleteDialogDescription")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
