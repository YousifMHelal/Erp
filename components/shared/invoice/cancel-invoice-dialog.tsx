"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CancelInvoiceDialogProps } from "@/types";

export function CancelInvoiceDialog({
  open,
  onOpenChange,
  invoiceNumber,
  isPending,
  onConfirm,
}: CancelInvoiceDialogProps) {
  const t = useTranslations("invoices.detail");
  const tCommon = useTranslations("common");
  const [reason, setReason] = useState("");

  function handleConfirm() {
    onConfirm(reason);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("cancelDialogTitle", { number: invoiceNumber })}</DialogTitle>
          <DialogDescription>{t("cancelDialogDescription")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cancel-reason">{t("cancelReasonLabel")}</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("cancelReasonPlaceholder")}
            rows={3}
            disabled={isPending}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
            {t("cancelDialogDismiss")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? tCommon("saving") : t("cancelDialogConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
