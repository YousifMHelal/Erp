"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cancelMoneyDocumentSchema } from "@/lib/validations";
import type { CancelMoneyDocumentDialogProps } from "@/types";

export function CancelMoneyDocumentDialog({ document, onOpenChange, onConfirm, isPending }: CancelMoneyDocumentDialogProps) {
  const t = useTranslations("moneyDocuments.list");
  const tCommon = useTranslations("common");
  const [reason, setReason] = useState("");
  const valid = document && cancelMoneyDocumentSchema.safeParse({ id: document.id, reason }).success;

  return (
    <Dialog open={!!document} onOpenChange={(open) => { onOpenChange(open); if (!open) setReason(""); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("cancelTitle", { number: String(document?.number ?? 0).padStart(5, "0") })}</DialogTitle>
          <DialogDescription>{t("cancelDescription")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="money-cancel-reason">{t("cancelReasonLabel")}</Label>
          <Textarea id="money-cancel-reason" value={reason} onChange={(event) => setReason(event.target.value)}
            placeholder={t("cancelReasonPlaceholder")} rows={3} disabled={isPending} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>{tCommon("cancel")}</Button>
          <Button type="button" variant="destructive" disabled={!valid || isPending} onClick={() => void onConfirm(reason)}>
            {isPending ? tCommon("saving") : t("cancelAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
