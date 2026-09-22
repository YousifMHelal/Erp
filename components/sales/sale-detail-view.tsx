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
import { cancelSale } from "@/actions/sales.actions";
import type { InvoiceDetail, SaleDetailViewProps } from "@/types";

export function SaleDetailView({ sale, canEdit, canCancel }: SaleDetailViewProps) {
  const t = useTranslations("invoices.detail");
  const tList = useTranslations("invoices.list");
  const tAction = useTranslations("salesAction");
  const router = useRouter();
  const [printOpen, setPrintOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const invoiceNumber = String(sale.number).padStart(6, "0");
  const isCancelled = sale.status === "CANCELLED";

  const invoice: InvoiceDetail = {
    id: sale.id,
    number: sale.number,
    type: "SALE",
    status: isCancelled ? "CANCELLED" : "CONFIRMED",
    paymentStatus: sale.paymentStatus as InvoiceDetail["paymentStatus"],
    partyName: sale.customerName ?? tList("walkInCustomer"),
    partyId: sale.customerId ?? undefined,
    partyPhone: sale.customerPhone ?? undefined,
    partyBalance: sale.customerBalance ?? undefined,
    cashboxName: sale.cashboxName,
    userName: sale.cashierName,
    issuedAt: sale.issuedAt,
    subtotal: sale.subtotal,
    discountAmount: sale.discountAmount,
    total: sale.total,
    paidAmount: sale.paidAmount,
    remainingAmount: sale.remainingAmount,
    notes: sale.notes ?? undefined,
    cancelledAt: sale.cancelledAt ?? undefined,
    cancelledByName: sale.cancelledByName ?? undefined,
    cancelReason: sale.cancelReason ?? undefined,
    lines: sale.lines.map((line) => ({
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
    window.open(`/print/${sale.id}?size=${size}`, "_blank", "noopener,noreferrer");
  }

  function handleCancelConfirm(reason: string) {
    startTransition(async () => {
      const result = await cancelSale({ id: sale.id, reason });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setCancelOpen(false);
      toast.success(tAction("cancelledOk", { number: invoiceNumber }));
      // Outside the transition: batching the refresh with the dialog-close state
      // update lets the transition settle before the server re-render arrives,
      // leaving the page showing the invoice as still active.
      setTimeout(() => router.refresh(), 0);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <InvoiceActionsBar
        invoice={invoice}
        onPrint={() => setPrintOpen(true)}
        onCancel={canCancel ? () => setCancelOpen(true) : undefined}
        onEdit={canEdit ? () => router.push(`/sales/${sale.id}/edit`) : undefined}
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
          {isCancelled && sale.cancelReason && (
            <p className="text-body-sm text-danger-fg">
              {t("cancelReasonLabel")}: {sale.cancelReason}
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
