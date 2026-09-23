"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MoneyDocumentEditDialogProps } from "@/types";

export function MoneyDocumentEditDialog({ documentType, open, onOpenChange, document, onSave }: MoneyDocumentEditDialogProps) {
  const t = useTranslations("moneyDocuments.list");
  const tCommon = useTranslations("common");
  const [amount, setAmount] = useState(document?.amount ?? "0");
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setAmount(document?.amount ?? "0");
      setError(undefined);
    }
  }, [open, document]);

  const title = documentType === "COLLECTION" ? t("editCollectionTitle") : t("editPaymentTitle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!document) return;
    if (Number(amount) <= 0) {
      setError(tCommon("required"));
      return;
    }
    onSave(document.id, Number(amount).toFixed(2));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-amount">
              {t("columnAmount")} <span className="text-accent">*</span>
            </Label>
            <Input
              id="edit-amount"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-end tabular-nums"
            />
            {error && <p className="text-body-sm text-danger-fg">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="accent">
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
