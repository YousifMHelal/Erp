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
import { CancelInvoiceDialog } from "@/components/shared/invoice/cancel-invoice-dialog";
import { cancelReturn } from "@/actions/returns.actions";
import type { InvoiceDetail } from "@/types";

export function ReturnDetailView({
  invoice,
  canCancel,
  defaultPrintSize,
}: {
  invoice: InvoiceDetail;
  canCancel: boolean;
  defaultPrintSize: "A4" | "A5" | "80mm";
}) {
  const t = useTranslations("invoices.detail");
  const tAction = useTranslations("returnsAction");
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const invoiceNumber = String(invoice.number).padStart(6, "0");

  function handlePrint() {
    window.open(`/print/${invoice.id}?size=${defaultPrintSize}`, "_blank", "noopener,noreferrer");
  }

  function handleCancelConfirm(reason: string) {
    startTransition(async () => {
      const result = await cancelReturn({ id: invoice.id, reason });
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
        onPrint={handlePrint}
        onCancel={canCancel ? () => setCancelOpen(true) : undefined}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <InvoiceHeaderCard invoice={invoice} />
          <InvoiceLinesTable lines={invoice.lines} />
          {invoice.notes && (
            <p className="text-body-sm text-muted-foreground">
              {t("notesLabel")}: {invoice.notes}
            </p>
          )}
          {invoice.status === "CANCELLED" && invoice.cancelReason && (
            <p className="text-body-sm text-danger-fg">
              {t("cancelReasonLabel")}: {invoice.cancelReason}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <InvoicePartyCard invoice={invoice} />
          <InvoiceTotalsCard invoice={invoice} />
        </div>
      </div>

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
