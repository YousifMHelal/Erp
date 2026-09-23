"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import { Money } from "@/components/shared/money";
import { decimal } from "@/lib/money";
import { transferCashSchema } from "@/lib/validations";
import type { TransferCashDialogProps } from "@/types";

export function TransferCashDialog({ open, onOpenChange, cashboxes, onConfirm }: TransferCashDialogProps) {
  const t = useTranslations("cashboxes.transferDialog");
  const tCommon = useTranslations("common");
  const [fromCashboxId, setFromCashboxId] = useState<string | undefined>(undefined);
  const [toCashboxId, setToCashboxId] = useState<string | undefined>(undefined);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      setFromCashboxId(undefined);
      setToCashboxId(undefined);
      setAmount("");
      setError(undefined);
    }
  }, [open]);

  const fromCashbox = cashboxes.find((c) => c.id === fromCashboxId);
  const fromOptions = cashboxes.map((c) => ({ value: c.id, label: c.name }));
  const toOptions = cashboxes.filter((c) => c.id !== fromCashboxId).map((c) => ({ value: c.id, label: c.name }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = transferCashSchema.safeParse({ fromCashboxId, toCashboxId, amount });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? t("errorRequired"));
    if (fromCashbox && decimal(amount).gt(fromCashbox.balance)) {
      setError(t("errorInsufficientBalance"));
      return;
    }
    setError(undefined);
    setPending(true);
    try {
      if (await onConfirm(parsed.data)) onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>
              {t("fromLabel")} <span className="text-accent">*</span>
            </Label>
            <EntityCombobox
              options={fromOptions}
              value={fromCashboxId}
              onChange={(id) => {
                setFromCashboxId(id);
                if (id === toCashboxId) setToCashboxId(undefined);
              }}
            />
            {fromCashbox && (
              <span className="flex items-center justify-between text-caption text-muted-foreground">
                <span>{t("availableBalance")}</span>
                <Money value={fromCashbox.balance} />
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>
              {t("toLabel")} <span className="text-accent">*</span>
            </Label>
            <EntityCombobox options={toOptions} value={toCashboxId} onChange={setToCashboxId} disabled={!fromCashboxId} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="transfer-amount">
              {t("amountLabel")} <span className="text-accent">*</span>
            </Label>
            <Input
              id="transfer-amount"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-end tabular-nums"
            />
          </div>
          {error && <p className="text-body-sm text-danger-fg">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="accent" disabled={pending}>
              {t("confirmAction")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
