"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { InvoiceHeaderCard } from "@/components/shared/invoice/invoice-header-card";
import { InvoicePartyCard } from "@/components/shared/invoice/invoice-party-card";
import { InvoiceLinesTable } from "@/components/shared/invoice/invoice-lines-table";
import { InvoiceTotalsCard } from "@/components/shared/invoice/invoice-totals-card";
import { InvoiceActionsBar } from "@/components/shared/invoice/invoice-actions-bar";
import { PrintSizeDialog } from "@/components/shared/invoice/print-size-dialog";
import { CancelInvoiceDialog } from "@/components/shared/invoice/cancel-invoice-dialog";
import { cancelPurchase } from "@/actions/purchases.actions";
import type { InvoiceDetail, PurchaseDetailViewProps } from "@/types";

export function PurchaseDetailView({ purchase, canEdit, canCancel }: PurchaseDetailViewProps) {
  const t = useTranslations("invoices.detail");
  const tAction = useTranslations("purchasesAction");
  const router = useRouter();
  const [printOpen, setPrintOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const invoiceNumber = String(purchase.number).padStart(6, "0");
  const isCancelled = purchase.status === "CANCELLED";

  const invoice: InvoiceDetail = {
    id: purchase.id,
    number: purchase.number,
    type: "PURCHASE",
    status: isCancelled ? "CANCELLED" : "CONFIRMED",
    paymentStatus: purchase.paymentStatus as InvoiceDetail["paymentStatus"],
    partyName: purchase.supplierName ?? "",
    partyId: purchase.supplierId ?? undefined,
    partyPhone: purchase.supplierPhone ?? undefined,
    partyBalance: purchase.supplierBalance ?? undefined,
    cashboxName: purchase.cashboxName,
    userName: purchase.userName,
    issuedAt: purchase.issuedAt,
    subtotal: purchase.subtotal,
    discountAmount: purchase.discountAmount,
    total: purchase.total,
    paidAmount: purchase.paidAmount,
    remainingAmount: purchase.remainingAmount,
    notes: purchase.notes ?? undefined,
    cancelledAt: purchase.cancelledAt ?? undefined,
    cancelledByName: purchase.cancelledByName ?? undefined,
    cancelReason: purchase.cancelReason ?? undefined,
    lines: purchase.lines.map((line) => ({
      id: line.id,
      productName: line.productName,
      unitName: line.unitName,
      qty: Number(line.qtyInUnit),
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    })),
  };

  function handlePrintSelect(size: "A4" | "A5" | "80mm") {
    setPrintOpen(false);
    window.open(`/print/${purchase.id}?size=${size}`, "_blank", "noopener,noreferrer");
  }

  function handleCancelConfirm(reason: string) {
    startTransition(async () => {
      const result = await cancelPurchase({ id: purchase.id, reason });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setCancelOpen(false);
      toast.success(tAction("cancelledOk", { number: invoiceNumber }));
      setTimeout(() => router.refresh(), 0);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <InvoiceActionsBar
        invoice={invoice}
        onPrint={() => setPrintOpen(true)}
        onCancel={canCancel ? () => setCancelOpen(true) : undefined}
        onEdit={canEdit ? () => router.push(`/purchases/${purchase.id}/edit`) : undefined}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <InvoiceHeaderCard invoice={invoice} />
          <InvoiceLinesTable lines={invoice.lines} />
          {invoice.notes && (
            <p className="text-body-sm text-muted-foreground">
              {t("notesLabel")}: {invoice.notes}
            </p>
          )}
          {isCancelled && purchase.cancelReason && (
            <p className="text-body-sm text-danger-fg">
              {t("cancelReasonLabel")}: {purchase.cancelReason}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <InvoicePartyCard invoice={invoice} />
          <InvoiceTotalsCard invoice={invoice} />
        </div>
      </div>

      <PrintSizeDialog open={printOpen} onOpenChange={setPrintOpen} onSelect={handlePrintSelect} />
      <CancelInvoiceDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        invoiceNumber={invoiceNumber}
        isPending={isPending}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}
