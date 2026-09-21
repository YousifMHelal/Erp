"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import { Money } from "@/components/shared/money";
import { OriginalInvoicePicker } from "@/components/shared/returns/original-invoice-picker";
import { ReturnLinesTable } from "@/components/shared/returns/return-lines-table";
import type { ReturnFormProps, ReturnLineDraft } from "@/types";

export function ReturnForm({ documentType, originalInvoices, originalInvoiceLines, cashboxOptions }: ReturnFormProps) {
  const t = useTranslations("returns.form");
  const [invoiceId, setInvoiceId] = useState<string | undefined>(undefined);
  const [cashboxId, setCashboxId] = useState<string | undefined>(cashboxOptions[0]?.value);
  const [lines, setLines] = useState<ReturnLineDraft[]>([]);

  function handleSelectInvoice(id: string | undefined) {
    setInvoiceId(id);
    if (!id) {
      setLines([]);
      return;
    }
    const sourceLines = originalInvoiceLines[id] ?? [];
    setLines(
      sourceLines
        .filter((line) => line.qtyInvoiced - line.qtyAlreadyReturned > 0)
        .map((line) => ({
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
  }

  function updateQty(lineId: string, qty: number) {
    setLines((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, qty, lineTotal: qty * l.unitPrice } : l)));
  }

  const total = useMemo(() => lines.reduce((sum, l) => sum + l.lineTotal, 0), [lines]);
  const hasReturnableLines = lines.some((l) => l.qty > 0);

  function handleSave() {
    if (!invoiceId || !hasReturnableLines) {
      toast.error(t("errorNoLines"));
      return;
    }
    toast.success(t("saveSuccess"));
    // P5-7 wires this to the real returns.actions.ts server action.
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("originalInvoiceTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <OriginalInvoicePicker options={originalInvoices} selectedId={invoiceId} onSelect={handleSelectInvoice} />
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
              <EntityCombobox options={cashboxOptions} value={cashboxId} onChange={setCashboxId} />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-h3 font-semibold">{t("totalLabel")}</span>
              <Money value={String(total)} className="text-display" />
            </div>
            <p className="text-body-sm text-muted-foreground">
              {documentType === "SALE_RETURN" ? t("refundHintSale") : t("refundHintPurchase")}
            </p>
          </CardContent>
        </Card>
        <Button type="button" variant="accent" size="lg" onClick={handleSave} disabled={!hasReturnableLines}>
          {t("saveReturn")}
        </Button>
      </div>
    </div>
  );
}
