"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import { Money } from "@/components/shared/money";
import { OriginalInvoicePicker } from "@/components/shared/returns/original-invoice-picker";
import { ReturnLinesTable } from "@/components/shared/returns/return-lines-table";
import {
  createPurchaseReturn,
  createSaleReturn,
  getPurchaseOriginalInvoiceLines,
  getSaleOriginalInvoiceLines,
} from "@/actions/returns.actions";
import { toSubUnits } from "@/lib/units";
import type { OriginalInvoiceLine, ReturnFormViewProps, ReturnLineDraft, UnitType } from "@/types";

export function ReturnFormView({ documentType, options }: ReturnFormViewProps) {
  const t = useTranslations("returns.form");
  const tAction = useTranslations("returnsAction");
  const router = useRouter();
  const [invoiceId, setInvoiceId] = useState<string | undefined>(undefined);
  const [cashboxId, setCashboxId] = useState<string | undefined>(options.cashboxes[0]?.value);
  const [settleFromCashbox, setSettleFromCashbox] = useState(true);
  const [lines, setLines] = useState<ReturnLineDraft[]>([]);
  const [lineUnits, setLineUnits] = useState<Record<string, { unitType: UnitType; unitsPerBase: number }>>({});
  const [isPending, startTransition] = useTransition();
  const isSaleReturn = documentType === "SALE_RETURN";

  function handleSelectInvoice(id: string | undefined) {
    setInvoiceId(id);
    if (!id) {
      setLines([]);
      setLineUnits({});
      return;
    }
    startTransition(async () => {
      const result = isSaleReturn
        ? await getSaleOriginalInvoiceLines(id)
        : await getPurchaseOriginalInvoiceLines(id);
      if (!result.success) {
        toast.error(result.error);
        setLines([]);
        setLineUnits({});
        return;
      }
      const sourceLines: OriginalInvoiceLine[] = result.data.lines;
      const returnable = sourceLines.filter((line) => line.qtyInvoiced - line.qtyAlreadyReturned > 0);
      setLines(
        returnable.map((line) => ({
          lineId: line.id,
          productId: line.productId,
          productName: line.productName,
          unitName: line.unitName,
          maxReturnableQty: line.qtyInvoiced - line.qtyAlreadyReturned,
          qty: 0,
          unitPrice: Number(line.unitPrice),
          lineTotal: 0,
        })),
      );
      setLineUnits(
        Object.fromEntries(
          returnable.map((line) => [line.productId, { unitType: line.unitType, unitsPerBase: line.unitsPerBase }]),
        ),
      );
    });
  }

  function updateQty(lineId: string, qty: number) {
    setLines((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, qty, lineTotal: qty * l.unitPrice } : l)));
  }

  const total = useMemo(() => lines.reduce((sum, l) => sum + l.lineTotal, 0), [lines]);
  const hasReturnableLines = lines.some((l) => l.qty > 0);

  function handleSave() {
    if (!invoiceId || !hasReturnableLines || !cashboxId) {
      toast.error(t("errorNoLines"));
      return;
    }

    const payload = {
      originalInvoiceId: invoiceId,
      cashboxId,
      settleFromCashbox,
      lines: lines
        .filter((line) => line.qty > 0)
        .map((line) => {
          const unitInfo = lineUnits[line.productId];
          const qtyInSub = unitInfo
            ? toSubUnits(line.qty, unitInfo.unitType, unitInfo.unitsPerBase)
            : line.qty;
          return { productId: line.productId, qtyInSub: String(qtyInSub) };
        }),
    };

    startTransition(async () => {
      const result = isSaleReturn
        ? await createSaleReturn(payload)
        : await createPurchaseReturn(payload);
      if (!result.success) {
        const fieldError = Object.values(result.fieldErrors ?? {}).flat().find(Boolean);
        toast.error(fieldError ?? result.error);
        return;
      }
      const number = String(result.data.number).padStart(6, "0");
      toast.success(tAction("created", { number }));
      router.push(isSaleReturn ? `/sales-returns/${result.data.id}` : `/purchase-returns/${result.data.id}`);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <div className="flex min-w-0 flex-col gap-4">
        <Card className="shrink-0">
          <CardHeader>
            <CardTitle>{t("originalInvoiceTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <OriginalInvoicePicker options={options.originalInvoices} selectedId={invoiceId} onSelect={handleSelectInvoice} />
          </CardContent>
        </Card>
        <ReturnLinesTable lines={lines} onUpdateQty={updateQty} />
      </div>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("settlementTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t("cashboxLabel")}</Label>
              <EntityCombobox options={options.cashboxes} value={cashboxId} onChange={setCashboxId} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="settle-from-cashbox">{t("settleFromCashboxLabel")}</Label>
              <Switch id="settle-from-cashbox" checked={settleFromCashbox} onCheckedChange={setSettleFromCashbox} />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-h3 font-semibold">{t("totalLabel")}</span>
              <Money value={String(total)} className="text-h2" />
            </div>
            <p className="text-body-sm text-muted-foreground">
              {isSaleReturn
                ? settleFromCashbox
                  ? t("refundHintSale")
                  : t("balanceHintSale")
                : settleFromCashbox
                  ? t("refundHintPurchase")
                  : t("balanceHintPurchase")}
            </p>
          </CardContent>
        </Card>
        <Button type="button" variant="accent" size="lg" onClick={handleSave} disabled={!hasReturnableLines || isPending}>
          {t("saveReturn")}
        </Button>
      </div>
    </div>
  );
}
