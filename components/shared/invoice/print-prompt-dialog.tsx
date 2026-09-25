"use client";

import { Copy, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { printInvoice } from "@/lib/print-invoice";

type PrintPromptDialogProps = {
  invoiceId: string | null;
  onFinish: (invoiceId: string) => void;
};

/** After saving: print, copy as image, or skip — every choice then continues to `onFinish`. */
export function PrintPromptDialog({ invoiceId, onFinish }: PrintPromptDialogProps) {
  const t = useTranslations("invoices.form");

  function handlePrint() {
    if (!invoiceId) return;
    printInvoice(invoiceId, "A4");
    onFinish(invoiceId);
  }

  function handleCopy() {
    if (!invoiceId) return;
    // Copying needs the rendered invoice, so it opens the print page, which copies on load.
    window.open(`/print/${invoiceId}?size=A4&action=copy`, "_blank", "noopener,noreferrer");
    onFinish(invoiceId);
  }

  return (
    <Dialog
      open={invoiceId !== null}
      onOpenChange={(open) => {
        if (!open && invoiceId) onFinish(invoiceId);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("printPromptTitle")}</DialogTitle>
          <DialogDescription>{t("printPromptDescription")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" variant="primary" onClick={handlePrint} className="w-full sm:w-auto">
            <Printer />
            {t("printPromptConfirm")}
          </Button>
          <Button type="button" variant="outline" onClick={handleCopy} className="w-full sm:w-auto">
            <Copy />
            {t("printPromptCopy")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => invoiceId && onFinish(invoiceId)}
            className="w-full sm:w-auto"
          >
            {t("printPromptSkip")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
