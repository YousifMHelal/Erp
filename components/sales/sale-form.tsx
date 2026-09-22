"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LineItemsTable } from "@/components/shared/invoice/line-items-table";
import { TotalsPanel } from "@/components/shared/invoice/totals-panel";
import { PaymentPanel } from "@/components/shared/invoice/payment-panel";
import { HotkeyBar } from "@/components/shared/invoice/hotkey-bar";
import { Money } from "@/components/shared/money";
import { SaleProductSearch } from "@/components/sales/sale-product-search";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { createSale, getSalePriceSuggestion, updateSale } from "@/actions/sales.actions";
import { toSubUnits } from "@/lib/units";
import { decimal } from "@/lib/money";
import type {
  InvoiceLineDraft,
  SaleFormProps,
  SaleLineStock,
  SaleProductOption,
} from "@/types";

let lineIdCounter = 0;

export function SaleForm({ options, initialSale }: SaleFormProps) {
  const t = useTranslations("invoices.form");
  const tAction = useTranslations("salesAction");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const isEditMode = initialSale !== undefined;
  const [lines, setLines] = useState<InvoiceLineDraft[]>(
    () => initialSale?.lines ?? [],
  );
  const [discountAmount, setDiscountAmount] = useState(
    Number(initialSale?.discountAmount ?? 0),
  );
  const [paidAmount, setPaidAmount] = useState(Number(initialSale?.paidAmount ?? 0));
  const [customerId, setCustomerId] = useState<string | undefined>(
    initialSale?.customerId ?? undefined,
  );
  const [cashboxId, setCashboxId] = useState<string | undefined>(
    initialSale?.cashboxId ?? options.cashboxes[0]?.id,
  );
  const [isPending, startTransition] = useTransition();
  const productSearchRef = useRef<HTMLInputElement>(null);

  /**
   * Available sub-unit stock per product, captured when the product was added.
   * Used only to block an obviously-impossible line before submitting — `createSale`
   * re-checks inside its transaction, which is the real enforcement point.
   */
  const stockRef = useRef<Map<string, SaleLineStock>>(
    new Map(initialSale?.stock.map((entry) => [entry.productId, entry])),
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.lineTotal, 0),
    [lines],
  );
  const total = Math.max(subtotal - discountAmount, 0);

  function applyPriceSuggestion(productId: string) {
    startTransition(async () => {
      const result = await getSalePriceSuggestion({ productId, customerId });
      if (!result.success) return;
      const pricePerSub = Number(result.data.pricePerSub);
      setLines((prev) =>
        prev.map((line) =>
          line.productId === productId && line.unitType === "SUB"
            ? recalcLine({ ...line, unitPrice: pricePerSub })
            : line,
        ),
      );
    });
  }

  function addProduct(product: SaleProductOption) {
    stockRef.current.set(product.id, {
      stockQty: product.stockQty,
      productName: product.name,
      subUnitName: product.subUnitName,
    });

    setLines((prev) => {
      const existing = prev.find(
        (line) => line.productId === product.id && line.unitType === "SUB",
      );
      if (existing) {
        return prev.map((line) =>
          line.lineId === existing.lineId
            ? recalcLine({ ...line, qty: line.qty + 1 })
            : line,
        );
      }
      lineIdCounter += 1;
      return [
        ...prev,
        recalcLine({
          lineId: `line-${lineIdCounter}`,
          productId: product.id,
          productName: product.name,
          unitType: "SUB",
          baseUnitName: product.baseUnitName,
          subUnitName: product.subUnitName,
          unitsPerBase: Number(product.unitsPerBase),
          qty: 1,
          unitPrice: Number(product.pricePerSub),
          lineTotal: 0,
        }),
      ];
    });

    // The catalogue price is only a starting point — ask the server for the
    // customer/recent-sale suggestion and correct the line once it arrives.
    applyPriceSuggestion(product.id);
  }

  function updateLine(lineId: string, patch: Partial<InvoiceLineDraft>) {
    setLines((prev) =>
      prev.map((line) =>
        line.lineId === lineId ? recalcLine({ ...line, ...patch }) : line,
      ),
    );
  }

  // Lowering a quantity, price or discount can pull the total below what is already
  // recorded as paid, which the action rejects. Follow the total down so the form
  // stays submittable instead of failing at save time.
  useEffect(() => {
    setPaidAmount((paid) => (paid > total ? total : paid));
  }, [total]);

  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((line) => line.lineId !== lineId));
  }

  /** Hard negative-stock block: refuses to submit a line that exceeds stock. */
  function findStockError(): string | null {
    const requestedPerProduct = new Map<string, ReturnType<typeof decimal>>();
    for (const line of lines) {
      const inSub = toSubUnits(line.qty, line.unitType, line.unitsPerBase);
      const running = requestedPerProduct.get(line.productId);
      requestedPerProduct.set(line.productId, running ? running.plus(inSub) : inSub);
    }
    for (const [productId, requested] of requestedPerProduct) {
      const stock = stockRef.current.get(productId);
      if (!stock) continue;
      if (requested.gt(decimal(stock.stockQty))) {
        return t("errorInsufficientStock", {
          product: stock.productName,
          available: decimal(stock.stockQty).toString(),
          unit: stock.subUnitName,
        });
      }
    }
    return null;
  }

  function handleSave() {
    if (lines.length === 0) {
      toast.error(t("errorEmptyLines"));
      return;
    }
    if (!cashboxId) {
      toast.error(t("errorNoCashbox"));
      return;
    }
    const stockError = findStockError();
    if (stockError) {
      toast.error(stockError);
      return;
    }

    const payload = {
      customerId,
      cashboxId,
      discountAmount: discountAmount.toFixed(2),
      paidAmount: paidAmount.toFixed(2),
      lines: lines.map((line) => ({
        productId: line.productId,
        unitType: line.unitType,
        qtyInUnit: String(line.qty),
        unitPrice: line.unitPrice.toFixed(4),
      })),
    };

    startTransition(async () => {
      const result = initialSale
        ? await updateSale({
            ...payload,
            id: initialSale.id,
            // Sent back unchanged so the action can reject a concurrent edit.
            updatedAt: initialSale.updatedAt,
          })
        : await createSale(payload);

      if (!result.success) {
        // Field errors carry the precise reason (e.g. paid exceeds the new total);
        // the generic message alone would leave the user guessing which input to fix.
        const fieldError = Object.values(result.fieldErrors ?? {})
          .flat()
          .find(Boolean);
        toast.error(fieldError ?? result.error);
        return;
      }

      const number = String(result.data.number).padStart(6, "0");
      toast.success(tAction(isEditMode ? "updated" : "created", { number }));
      if (!isEditMode) {
        window.open(`/print/${result.data.id}?size=A4`, "_blank", "noopener,noreferrer");
      }
      router.push(`/sales/${result.data.id}`);
    });
  }

  useHotkeys({
    focusProductSearch: () => productSearchRef.current?.focus(),
    save: handleSave,
    saveAndNew: handleSave,
  });

  const saveLabel = isPending
    ? tCommon("saving")
    : isEditMode
      ? t("updateInvoice")
      : t("saveInvoice");

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4 overflow-y-auto lg:overflow-hidden">
          <div className="m-1">
            <SaleProductSearch ref={productSearchRef} onAddLine={addProduct} />
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
            documentType="SALE"
            cashboxOptions={options.cashboxes.map((c) => ({ value: c.id, label: c.name }))}
            cashboxId={cashboxId}
            onCashboxChange={setCashboxId}
            partyOptions={options.customers.map((c) => ({ value: c.id, label: c.name }))}
            partyId={customerId}
            onPartyChange={setCustomerId}
            paidAmount={paidAmount}
            onPaidAmountChange={setPaidAmount}
            total={total}
          />
          <Button
            type="button"
            variant="accent"
            size="lg"
            disabled={isPending}
            onClick={handleSave}
            className="hidden w-full lg:flex"
          >
            {saveLabel}
          </Button>
        </div>
      </div>

      <HotkeyBar />

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-border bg-card p-3 shadow-elevation-lg lg:hidden">
        <div className="flex flex-col">
          <span className="text-caption text-muted-foreground">{t("totalLabel")}</span>
          <Money value={String(total)} className="text-h3 font-semibold" />
        </div>
        <Button
          type="button"
          variant="accent"
          size="lg"
          disabled={isPending}
          onClick={handleSave}
          className="flex-1"
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}

function recalcLine(line: InvoiceLineDraft): InvoiceLineDraft {
  return { ...line, lineTotal: line.qty * line.unitPrice };
}
