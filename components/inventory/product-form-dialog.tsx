"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import { UnitConversionPreview } from "@/components/inventory/unit-conversion-preview";
import type { ProductFormDialogProps } from "@/types";

export function ProductFormDialog({ open, onOpenChange, categoryOptions, product }: ProductFormDialogProps) {
  const t = useTranslations("inventory.form");
  const isEdit = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [baseUnitName, setBaseUnitName] = useState(product?.baseUnitName ?? "كرتونة");
  const [subUnitName, setSubUnitName] = useState(product?.subUnitName ?? "قطعة");
  const [unitsPerBase, setUnitsPerBase] = useState(product?.unitsPerBase ?? 1);
  const [purchasePricePerBase, setPurchasePricePerBase] = useState(Number(product?.purchasePricePerBase ?? 0));
  const [sellPricePerBase, setSellPricePerBase] = useState(Number(product?.sellPricePerBase ?? 0));
  const [minStockQty, setMinStockQty] = useState(product?.minStockQty ?? 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      toast.error(t("errorRequired"));
      return;
    }
    toast.success(isEdit ? t("updateSuccess") : t("createSuccess"));
    onOpenChange(false);
    // P5-3 wires this to the real inventory.actions.ts create/update.
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Tabs defaultValue="general">
            <TabsList className="w-full">
              <TabsTrigger value="general">{t("tabGeneral")}</TabsTrigger>
              <TabsTrigger value="units">{t("tabUnits")}</TabsTrigger>
              <TabsTrigger value="prices">{t("tabPrices")}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="product-name">
                  {t("nameLabel")} <span className="text-accent">*</span>
                </Label>
                <Input id="product-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="product-sku">
                    {t("skuLabel")} <span className="text-accent">*</span>
                  </Label>
                  <Input id="product-sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU-001" className="tabular-nums" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="product-barcode">{t("barcodeLabel")}</Label>
                  <Input
                    id="product-barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="6221031xxxxxx"
                    className="tabular-nums"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("categoryLabel")}</Label>
                <EntityCombobox options={categoryOptions} value={categoryId} onChange={setCategoryId} placeholder={t("categoryPlaceholder")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="product-min-stock">{t("minStockLabel")}</Label>
                <Input
                  id="product-min-stock"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={minStockQty}
                  onChange={(e) => setMinStockQty(Number(e.target.value))}
                  className="text-end tabular-nums"
                  placeholder="مثال: ١٠"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="product-notes">{t("notesLabel")}</Label>
                <Textarea id="product-notes" placeholder={t("notesPlaceholder")} rows={2} />
              </div>
            </TabsContent>

            <TabsContent value="units" className="flex flex-col gap-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="base-unit">{t("baseUnitLabel")}</Label>
                  <Input id="base-unit" value={baseUnitName} onChange={(e) => setBaseUnitName(e.target.value)} placeholder="مثال: كرتونة" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sub-unit">{t("subUnitLabel")}</Label>
                  <Input id="sub-unit" value={subUnitName} onChange={(e) => setSubUnitName(e.target.value)} placeholder="مثال: قطعة" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="units-per-base">{t("unitsPerBaseLabel")}</Label>
                <Input
                  id="units-per-base"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  step="any"
                  value={unitsPerBase}
                  onChange={(e) => setUnitsPerBase(Number(e.target.value))}
                  className="text-end tabular-nums"
                  placeholder="مثال: ١٠"
                />
              </div>
              <UnitConversionPreview
                baseUnitName={baseUnitName || t("baseUnitLabel")}
                subUnitName={subUnitName || t("subUnitLabel")}
                unitsPerBase={unitsPerBase}
                purchasePricePerBase={purchasePricePerBase}
                sellPricePerBase={sellPricePerBase}
              />
            </TabsContent>

            <TabsContent value="prices" className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="purchase-price">{t("purchasePriceLabel", { unit: baseUnitName || t("baseUnitLabel") })}</Label>
                <Input
                  id="purchase-price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={purchasePricePerBase}
                  onChange={(e) => setPurchasePricePerBase(Number(e.target.value))}
                  className="text-end tabular-nums"
                  placeholder="٠٫٠٠"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sell-price">{t("sellPriceLabel", { unit: baseUnitName || t("baseUnitLabel") })}</Label>
                <Input
                  id="sell-price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={sellPricePerBase}
                  onChange={(e) => setSellPricePerBase(Number(e.target.value))}
                  className="text-end tabular-nums"
                  placeholder="٠٫٠٠"
                />
              </div>
              <UnitConversionPreview
                baseUnitName={baseUnitName || t("baseUnitLabel")}
                subUnitName={subUnitName || t("subUnitLabel")}
                unitsPerBase={unitsPerBase}
                purchasePricePerBase={purchasePricePerBase}
                sellPricePerBase={sellPricePerBase}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="accent">
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
