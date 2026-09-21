"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductSearch } from "@/components/shared/invoice/product-search";
import { LineItemsTable } from "@/components/shared/invoice/line-items-table";
import { TotalsPanel } from "@/components/shared/invoice/totals-panel";
import { PaymentPanel } from "@/components/shared/invoice/payment-panel";
import { HotkeyBar } from "@/components/shared/invoice/hotkey-bar";
import { Money } from "@/components/shared/money";
import { useHotkeys } from "@/hooks/use-hotkeys";
import type { InvoiceFormProps, InvoiceLineDraft, SearchableProduct } from "@/types";

let lineIdCounter = 0;

// Hardcoded until Settings > PrintPreferences.defaultPrintSize is read from the backend (P4-7+).
const DEFAULT_PRINT_SIZE: "A4" | "A5" | "80mm" = "A4";

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
    unitPrice: Number(product.pricePerSub),
    lineTotal: Number(product.pricePerSub),
  };
}

export function InvoiceForm({ documentType, products, partyOptions, cashboxOptions, initialInvoice }: InvoiceFormProps) {
  const t = useTranslations("invoices.form");
  const isEditMode = Boolean(initialInvoice);
  const [lines, setLines] = useState<InvoiceLineDraft[]>(initialInvoice?.lines ?? []);
  const [discountAmount, setDiscountAmount] = useState(initialInvoice?.discountAmount ?? 0);
  const [paidAmount, setPaidAmount] = useState(initialInvoice?.paidAmount ?? 0);
  const [partyId, setPartyId] = useState<string | undefined>(initialInvoice?.partyId);
  const [cashboxId, setCashboxId] = useState<string | undefined>(initialInvoice?.cashboxId ?? cashboxOptions[0]?.value);
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
    const invoiceNumber = initialInvoice?.number ?? "000123";

    if (isEditMode) {
      // Phase 2 is UI-only: no real updateSale/updatePurchase Server Action exists yet
      // (that lands with P4-9/P5-5), so this just confirms the edit locally.
      toast.success(t("updatedTitle", { number: invoiceNumber }));
      return;
    }

    // P4-9/P5-5 wires this to the real createSale/createPurchase server action.
    toast.success(t("savedTitle", { number: invoiceNumber }));
    // Real "shop default print size" comes from PrintPreferences once settings are backed by
    // a Server Action (P4-7+); hardcoded here since InvoiceForm only receives static props in Phase 2.
    window.open(`/print/${invoiceNumber}?size=${DEFAULT_PRINT_SIZE}`, "_blank", "noopener,noreferrer");
    resetForm();
  }

  function resetForm() {
    setLines([]);
    setDiscountAmount(0);
    setPaidAmount(0);
    setPartyId(undefined);
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
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4 overflow-y-auto lg:overflow-hidden">
          <div className="m-1">
            <ProductSearch ref={productSearchRef} products={products} onAddLine={addLine} />
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
            documentType={documentType}
            cashboxOptions={cashboxOptions}
            cashboxId={cashboxId}
            onCashboxChange={setCashboxId}
            partyOptions={partyOptions}
            partyId={partyId}
            onPartyChange={setPartyId}
            paidAmount={paidAmount}
            onPaidAmountChange={setPaidAmount}
            total={total}
          />
          <Button type="button" variant="accent" size="lg" onClick={handleSave} className="hidden w-full lg:flex">
            {isEditMode ? t("updateInvoice") : t("saveInvoice")}
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
          {isEditMode ? t("updateInvoice") : t("saveInvoice")}
        </Button>
      </div>
    </div>
  );
}

function recalcLine(line: InvoiceLineDraft): InvoiceLineDraft {
  return { ...line, lineTotal: line.qty * line.unitPrice };
}
