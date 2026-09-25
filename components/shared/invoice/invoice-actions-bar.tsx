"use client";

import { useState } from "react";
import { Ban, Copy, MessageCircle, Pencil, Printer, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  captureInvoicePng,
  copyInvoiceImage,
  downloadBlob,
  isTouchDevice,
  toWhatsAppNumber,
} from "@/lib/print-invoice";
import type { InvoiceActionsBarProps } from "@/types";

export function InvoiceActionsBar({ invoice, printSize, onPrint, onCancel, onEdit, onDelete }: InvoiceActionsBarProps) {
  const t = useTranslations("invoices.detail");
  const [busy, setBusy] = useState<"copy" | "whatsapp" | null>(null);
  const isCancelled = invoice.status === "CANCELLED";
  const fileName = `invoice-${String(invoice.number).padStart(6, "0")}.png`;

  async function downloadFallback(cause: unknown) {
    console.error("Invoice image copy/share failed", cause);
    try {
      downloadBlob(await captureInvoicePng(invoice.id, printSize), fileName);
      toast.info(t("imageDownloadedInstead"));
    } catch (error) {
      console.error("Invoice image render failed", error);
      toast.error(t("imageFailed"));
    }
  }

  async function handleCopy() {
    setBusy("copy");
    try {
      await copyInvoiceImage(invoice.id, printSize);
      toast.success(t("imageCopied"));
    } catch (error) {
      await downloadFallback(error);
    } finally {
      setBusy(null);
    }
  }

  function openWhatsApp() {
    const chat = window.open(`https://wa.me/${toWhatsAppNumber(invoice.partyPhone)}`, "_blank");
    if (chat) {
      chat.opener = null;
      return;
    }
    // Popup blocked (the click's user activation expired while the image rendered) — offer a fresh click.
    toast.info(t("whatsappReady"), { action: { label: t("openWhatsapp"), onClick: openWhatsApp } });
  }

  async function handleWhatsApp() {
    setBusy("whatsapp");
    try {
      // Phones: native share sheet carries the image straight into WhatsApp.
      const probe = new File([""], fileName, { type: "image/png" });
      if (isTouchDevice() && navigator.canShare?.({ files: [probe] })) {
        const blob = await captureInvoicePng(invoice.id, printSize);
        try {
          await navigator.share({ files: [new File([blob], fileName, { type: "image/png" })] });
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          downloadBlob(blob, fileName);
          toast.info(t("imageDownloadedInstead"));
        }
        return;
      }
      // Desktop: wa.me links can't carry files, so the image goes to the clipboard for a Ctrl+V paste.
      // Copy must finish before WhatsApp opens — a background tab can't write to the clipboard.
      await copyInvoiceImage(invoice.id, printSize);
      toast.success(t("whatsappPasteHint"), { duration: 8000 });
      openWhatsApp();
    } catch (error) {
      await downloadFallback(error);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" onClick={onPrint} className="max-sm:h-11">
        <Printer /> {t("printAction")}
      </Button>
      <Button type="button" variant="outline" onClick={handleCopy} disabled={busy !== null} className="max-sm:h-11">
        <Copy /> {busy === "copy" ? t("imagePreparing") : t("copyImageAction")}
      </Button>
      <Button type="button" variant="outline" onClick={handleWhatsApp} disabled={busy !== null} className="max-sm:h-11">
        <MessageCircle /> {busy === "whatsapp" ? t("imagePreparing") : t("shareAction")}
      </Button>
      {!isCancelled && (
        <div className="ms-auto flex items-center gap-2">
          {onEdit && (
            <Button type="button" variant="outline" onClick={onEdit} className="max-sm:h-11">
              <Pencil /> {t("editAction")}
            </Button>
          )}
          {onDelete && (
            <Button type="button" variant="destructive" onClick={onDelete} className="max-sm:h-11">
              <Trash2 /> {t("deleteAction")}
            </Button>
          )}
          {onCancel && (
            <Button type="button" variant="destructive" onClick={onCancel} className="max-sm:h-11">
              <Ban /> {t("cancelAction")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
