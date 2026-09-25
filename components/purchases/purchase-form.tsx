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
import { PrintPromptDialog } from "@/components/shared/invoice/print-prompt-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatMoney } from "@/lib/format";
import { Money } from "@/components/shared/money";
import { PurchaseProductSearch } from "@/components/purchases/purchase-product-search";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useOfflineAwareSave } from "@/hooks/use-offline-aware-save";
import { useOfflineFormSnapshot } from "@/hooks/use-offline-form-snapshot";
import { createPurchase, updatePurchase } from "@/actions/purchases.actions";
import type {
  InvoiceLineDraft,
  OfflinePurchasePayload,
  PurchaseFormOptions,
  PurchaseFormProps,
  SaleProductOption,
} from "@/types";

let lineIdCounter = 0;

export function PurchaseForm({ options, initialPurchase }: PurchaseFormProps) {
  const t = useTranslations("invoices.form");
  const tAction = useTranslations("purchasesAction");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const isEditMode = initialPurchase !== undefined;
  const [lines, setLines] = useState<InvoiceLineDraft[]>(
    () => initialPurchase?.lines ?? [],
  );
  const [discountAmount, setDiscountAmount] = useState(
    Number(initialPurchase?.discountAmount ?? 0),
  );
  const [paidAmount, setPaidAmount] = useState(Number(initialPurchase?.paidAmount ?? 0));
  const [supplierId, setSupplierId] = useState<string | undefined>(
    initialPurchase?.supplierId ?? undefined,
  );
  const [cashboxId, setCashboxId] = useState<string | undefined>(
    initialPurchase?.cashboxId ?? options.cashboxes[0]?.id,
  );
  const [isPending, startTransition] = useTransition();
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null);
  const [negativeCashWarning, setNegativeCashWarning] = useState<{ cashboxName: string; balanceAfter: number } | null>(
    null,
  );
  const productSearchRef = useRef<HTMLInputElement>(null);
  const saveDocument = useOfflineAwareSave();
  const offlineSnapshot = useOfflineFormSnapshot();
  // Offline, the device snapshot (with this device's unsynced entries applied) replaces the
  // possibly-cached server options — including the cashbox balances behind the negative-cash warning.
  const formOptions = useMemo<PurchaseFormOptions>(
    () =>
      offlineSnapshot
        ? {
            suppliers: offlineSnapshot.suppliers.map(({ id, name }) => ({ id, name })),
            cashboxes: offlineSnapshot.cashboxes,
          }
        : options,
    [offlineSnapshot, options],
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.lineTotal, 0),
    [lines],
  );
  const total = Math.max(subtotal - discountAmount, 0);

  function addProduct(product: SaleProductOption) {
    setLines((prev) => {
      const existing = prev.find(
        (line) => line.productId === product.id && line.unitType === "BASE",
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
        recalcLine({
          lineId: `line-${lineIdCounter}`,
          productId: product.id,
          productName: product.name,
          unitType: "BASE",
          baseUnitName: product.baseUnitName,
          subUnitName: product.subUnitName,
          unitsPerBase: Number(product.unitsPerBase),
          qty: 1,
          unitPrice: Number(product.pricePerBase),
          lineTotal: 0,
        }),
        ...prev,
      ];
    });
  }

  function updateLine(lineId: string, patch: Partial<InvoiceLineDraft>) {
    setLines((prev) =>
      prev.map((line) =>
        line.lineId === lineId ? recalcLine({ ...line, ...patch }) : line,
      ),
    );
  }

  useEffect(() => {
    setPaidAmount((paid) => (paid > total ? total : paid));
  }, [total]);

  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((line) => line.lineId !== lineId));
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

    const cashbox = formOptions.cashboxes.find((entry) => entry.id === cashboxId);
    if (cashbox?.balance !== undefined) {
      // On edit, this invoice's old payment goes back into its cashbox before the new one comes out.
      const refunded =
        initialPurchase && initialPurchase.cashboxId === cashboxId ? Number(initialPurchase.paidAmount) : 0;
      const balanceAfter = Number(cashbox.balance) + refunded - paidAmount;
      if (balanceAfter < 0 && paidAmount > 0) {
        setNegativeCashWarning({ cashboxName: cashbox.name, balanceAfter });
        return;
      }
    }
    submitPurchase();
  }

  function submitPurchase() {
    setNegativeCashWarning(null);
    if (!cashboxId) return;
    const payload: OfflinePurchasePayload = {
      supplierId,
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
      const result = initialPurchase
        ? await updatePurchase({
            ...payload,
            id: initialPurchase.id,
            updatedAt: initialPurchase.updatedAt,
          })
        : await createPurchaseOfflineAware(payload);
      if (!result) return;

      if (!result.success) {
        const fieldError = Object.values(result.fieldErrors ?? {})
          .flat()
          .find(Boolean);
        toast.error(fieldError ?? result.error);
        return;
      }

      const number = String(result.data.number).padStart(6, "0");
      toast.success(tAction(isEditMode ? "updated" : "created", { number }));
      if (isEditMode) {
        router.push(`/purchases/${result.data.id}`);
        return;
      }
      setSavedInvoiceId(result.data.id);
    });
  }

  /** Online: the server's answer, handled as before. Offline: queued on the device (null). */
  async function createPurchaseOfflineAware(payload: OfflinePurchasePayload) {
    const outcome = await saveDocument({
      kind: "purchase",
      payload,
      partyName: formOptions.suppliers.find((supplier) => supplier.id === supplierId)?.name ?? null,
      submit: createPurchase,
    });
    if (outcome.mode === "queued") resetForNextPurchase();
    return outcome.mode === "online" ? outcome.result : null;
  }

  function resetForNextPurchase() {
    setLines([]);
    setDiscountAmount(0);
    setPaidAmount(0);
    setSupplierId(undefined);
    productSearchRef.current?.focus();
  }

  function finishAfterSave(invoiceId: string) {
    setSavedInvoiceId(null);
    router.push(`/purchases/${invoiceId}`);
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
            <PurchaseProductSearch ref={productSearchRef} onAddLine={addProduct} />
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
            documentType="PURCHASE"
            cashboxOptions={formOptions.cashboxes.map((c) => ({ value: c.id, label: c.name }))}
            cashboxId={cashboxId}
            onCashboxChange={setCashboxId}
            partyOptions={formOptions.suppliers.map((s) => ({ value: s.id, label: s.name }))}
            partyId={supplierId}
            onPartyChange={setSupplierId}
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

      <PrintPromptDialog invoiceId={savedInvoiceId} onFinish={finishAfterSave} />
      <ConfirmDialog
        open={negativeCashWarning !== null}
        onOpenChange={(open) => !open && setNegativeCashWarning(null)}
        title={t("negativeCashTitle")}
        description={
          negativeCashWarning
            ? t("negativeCashDescription", {
                cashbox: negativeCashWarning.cashboxName,
                balance: formatMoney(String(negativeCashWarning.balanceAfter)),
              })
            : ""
        }
        confirmLabel={t("negativeCashConfirm")}
        isPending={isPending}
        onConfirm={submitPurchase}
      />
    </div>
  );
}

function recalcLine(line: InvoiceLineDraft): InvoiceLineDraft {
  return { ...line, lineTotal: line.qty * line.unitPrice };
}
