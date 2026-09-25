"use client";

import { useState } from "react";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { InvoiceDetailViewProps } from "@/types";

const EDIT_BASE_PATH: Record<string, string> = {
  SALE: "/sales",
  PURCHASE: "/purchases",
  SALE_RETURN: "/sales-returns",
  PURCHASE_RETURN: "/purchase-returns",
};

export function InvoiceDetailView({ invoice }: InvoiceDetailViewProps) {
  const t = useTranslations("invoices.detail");
  const tReturns = useTranslations("returns");
  const router = useRouter();
  const [printOpen, setPrintOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isReturn = invoice.type === "SALE_RETURN" || invoice.type === "PURCHASE_RETURN";
  const editBasePath = EDIT_BASE_PATH[invoice.type];
  const invoiceNumber = String(invoice.number).padStart(6, "0");

  function handlePrintSelect(size: "A4" | "A5" | "80mm") {
    setPrintOpen(false);
    toast.success(t("printStarted", { size }));
    // Opens the shared print-preview route — document-type-agnostic (PrintInvoiceData carries
    // documentTypeLabel), so this already works for both sales and purchases. Real PDF/stream
    // generation lands with P4-12.
    window.open(`/print/${invoice.id}?size=${size}`, "_blank", "noopener,noreferrer");
  }

  function handlePrintClick() {
    if (isReturn) {
      // Returns print directly with the default A4 template — no size-choice step.
      router.push(`/print/${invoice.id}?size=A4`);
      return;
    }
    setPrintOpen(true);
  }

  function handleCancelConfirm() {
    setCancelOpen(false);
    toast.success(t("cancelSuccess"));
    // P4-12 wires the real cancelSale server action.
  }

  function handleEdit() {
    if (isReturn) {
      // Phase 2 is UI-only: no edit route/Server Action exists yet, so this confirms the
      // intent locally. P5-7 wires this to the return form pre-filled via a real update flow.
      toast.success(tReturns("editSuccess"));
      return;
    }
    if (editBasePath) router.push(`${editBasePath}/${invoice.id}/edit`);
  }

  function handleDeleteConfirm() {
    setDeleteOpen(false);
    toast.success(isReturn ? tReturns("deleteSuccess") : t("deleteSuccess"));
    if (editBasePath) router.push(editBasePath);
    // NOTE: the real Server Action (P4-12/P5-5/P5-7) must implement this as cancel+reverse, not a
    // hard delete — AGENTS.md §2.5 forbids hard deletes on financial/inventory records.
  }

  return (
    <div className="flex flex-col gap-4">
      <InvoiceActionsBar
        invoice={invoice}
        printSize="A4"
        onPrint={handlePrintClick}
        onCancel={() => setCancelOpen(true)}
        onEdit={editBasePath ? handleEdit : undefined}
        onDelete={editBasePath ? () => setDeleteOpen(true) : undefined}
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
        onConfirm={handleCancelConfirm}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={
          isReturn
            ? tReturns("deleteDialogTitle", { number: invoiceNumber })
            : t("deleteDialogTitle", { number: invoiceNumber })
        }
        description={isReturn ? tReturns("deleteDialogDescription") : t("deleteDialogDescription")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
