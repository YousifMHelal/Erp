"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductSearch } from "@/components/sales/product-search";
import { LineItemsTable } from "@/components/sales/line-items-table";
import { TotalsPanel } from "@/components/sales/totals-panel";
import { PaymentPanel } from "@/components/sales/payment-panel";
import { HotkeyBar } from "@/components/sales/hotkey-bar";
import { SaveInvoiceDialog } from "@/components/sales/save-invoice-dialog";
import { Money } from "@/components/shared/money";
import { useHotkeys } from "@/hooks/use-hotkeys";
import type { InvoiceFormProps, InvoiceLineDraft, SearchableProduct } from "@/types";

let lineIdCounter = 0;

function draftFromProduct(product: SearchableProduct): InvoiceLineDraft {
  lineIdCounter += 1;
  return {
    lineId: `line-${lineIdCounter}`,
    productId: product.id,
    productName: product.name,
    unitType: "SUB",
    baseUnitName: product.baseUnitName,
    subUnitName: product.subUnitName,
    unitsPerBase: product.unitsPerBase,
    qty: 1,
    unitPrice: Number(product.sellPricePerSub),
    lineTotal: Number(product.sellPricePerSub),
  };
}

export function InvoiceForm({ products, customerOptions, cashboxOptions }: InvoiceFormProps) {
  const t = useTranslations("sales.new");
  const [lines, setLines] = useState<InvoiceLineDraft[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [cashboxId, setCashboxId] = useState<string | undefined>(cashboxOptions[0]?.value);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const productSearchRef = useRef<HTMLInputElement>(null);

  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.lineTotal, 0), [lines]);
  const total = Math.max(subtotal - discountAmount, 0);

  function addLine(product: SearchableProduct) {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === product.id && l.unitType === "SUB");
      if (existing) {
        return prev.map((l) => (l.lineId === existing.lineId ? recalcLine({ ...l, qty: l.qty + 1 }) : l));
      }
      return [...prev, draftFromProduct(product)];
    });
  }

  function updateLine(lineId: string, patch: Partial<InvoiceLineDraft>) {
    setLines((prev) => prev.map((l) => (l.lineId === lineId ? recalcLine({ ...l, ...patch }) : l)));
  }

  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  }

  function handleSave() {
    if (lines.length === 0) {
      toast.error(t("errorEmptyLines"));
      return;
    }
    // P4-9 wires this to the real createSale server action.
    setSaveDialogOpen(true);
  }

  function resetForm() {
    setLines([]);
    setDiscountAmount(0);
    setPaidAmount(0);
    setCustomerId(undefined);
    setSaveDialogOpen(false);
  }

  useHotkeys({
    focusProductSearch: () => productSearchRef.current?.focus(),
    save: handleSave,
    saveAndNew: () => {
      handleSave();
    },
  });

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[320px_1fr_340px]">
        <div className="hidden overflow-hidden rounded-md border border-border bg-card p-3 lg:flex lg:flex-col">
          <ProductSearch ref={productSearchRef} products={products} onAddLine={addLine} />
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto lg:overflow-hidden">
          <div className="lg:hidden">
            <ProductSearch products={products} onAddLine={addLine} />
          </div>
          <div className="min-h-0 flex-1">
            <LineItemsTable lines={lines} onUpdateLine={updateLine} onRemoveLine={removeLine} />
          </div>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto pb-24 lg:pb-0">
          <TotalsPanel
            subtotal={subtotal}
            discountAmount={discountAmount}
            onDiscountChange={setDiscountAmount}
            total={total}
          />
          <PaymentPanel
            cashboxOptions={cashboxOptions}
            cashboxId={cashboxId}
            onCashboxChange={setCashboxId}
            customerOptions={customerOptions}
            customerId={customerId}
            onCustomerChange={setCustomerId}
            paidAmount={paidAmount}
            onPaidAmountChange={setPaidAmount}
            total={total}
          />
          <Button type="button" variant="accent" size="lg" onClick={handleSave} className="hidden w-full lg:flex">
            {t("saveInvoice")}
          </Button>
        </div>
      </div>

      <HotkeyBar />

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-border bg-card p-3 shadow-elevation-lg lg:hidden">
        <div className="flex flex-col">
          <span className="text-caption text-muted-foreground">{t("totalLabel")}</span>
          <Money value={String(total)} className="text-h3 font-semibold" />
        </div>
        <Button type="button" variant="accent" size="lg" onClick={handleSave} className="flex-1">
          {t("saveInvoice")}
        </Button>
      </div>

      <SaveInvoiceDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        invoiceNumber="000123"
        onPrint={() => resetForm()}
        onSkip={resetForm}
      />
    </div>
  );
}

function recalcLine(line: InvoiceLineDraft): InvoiceLineDraft {
  return { ...line, lineTotal: line.qty * line.unitPrice };
}
