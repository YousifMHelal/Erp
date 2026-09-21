"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import { Money } from "@/components/shared/money";
import type { TransferCashDialogProps } from "@/types";

export function TransferCashDialog({ open, onOpenChange, cashboxes, onConfirm }: TransferCashDialogProps) {
  const t = useTranslations("cashboxes.transferDialog");
  const tCommon = useTranslations("common");
  const [fromCashboxId, setFromCashboxId] = useState<string | undefined>(undefined);
  const [toCashboxId, setToCashboxId] = useState<string | undefined>(undefined);
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      setFromCashboxId(undefined);
      setToCashboxId(undefined);
      setAmount(0);
      setError(undefined);
    }
  }, [open]);

  const fromCashbox = cashboxes.find((c) => c.id === fromCashboxId);
  const fromOptions = cashboxes.map((c) => ({ value: c.id, label: c.name }));
  const toOptions = cashboxes.filter((c) => c.id !== fromCashboxId).map((c) => ({ value: c.id, label: c.name }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fromCashboxId || !toCashboxId || amount <= 0) {
      setError(t("errorRequired"));
      return;
    }
    if (fromCashboxId === toCashboxId) {
      setError(t("errorSameCashbox"));
      return;
    }
    if (amount <= 0) {
      setError(t("errorAmountPositive"));
      return;
    }
    if (fromCashbox && amount > Number(fromCashbox.balance)) {
      setError(t("errorInsufficientBalance"));
      return;
    }

    setError(undefined);
    onConfirm({ fromCashboxId, toCashboxId, amount });
    onOpenChange(false);
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
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="٠٫٠٠"
              className="text-end tabular-nums"
            />
          </div>
          {error && <p className="text-body-sm text-danger-fg">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="accent">
              {t("confirmAction")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
