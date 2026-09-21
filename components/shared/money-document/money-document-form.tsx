"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import { PartyBalancePreview } from "@/components/shared/money-document/party-balance-preview";
import type { MoneyDocumentFormProps } from "@/types";

export function MoneyDocumentForm({ documentType, partyOptions, cashboxOptions }: MoneyDocumentFormProps) {
  const t = useTranslations("moneyDocuments.form");
  const [partyId, setPartyId] = useState<string | undefined>(undefined);
  const [cashboxId, setCashboxId] = useState<string | undefined>(cashboxOptions[0]?.value);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");

  const selectedParty = partyOptions.find((p) => p.value === partyId);
  const currentBalance = selectedParty?.balance ?? "0";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!partyId || amount <= 0) {
      toast.error(t("errorRequired"));
      return;
    }
    toast.success(documentType === "COLLECTION" ? t("collectionSaved") : t("paymentSaved"));
    // P6-5/P6-6 wires this to the real collections.actions.ts/payments.actions.ts.
  }

  const title = documentType === "COLLECTION" ? t("newCollectionTitle") : t("newPaymentTitle");
  const partyLabel = documentType === "COLLECTION" ? t("customerLabel") : t("supplierLabel");
  const partyPlaceholder = documentType === "COLLECTION" ? t("customerPlaceholder") : t("supplierPlaceholder");
  const submitLabel = documentType === "COLLECTION" ? t("saveCollection") : t("savePayment");

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>
              {partyLabel} <span className="text-accent">*</span>
            </Label>
            <EntityCombobox options={partyOptions} value={partyId} onChange={setPartyId} placeholder={partyPlaceholder} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>
              {t("cashboxLabel")} <span className="text-accent">*</span>
            </Label>
            <EntityCombobox options={cashboxOptions} value={cashboxId} onChange={setCashboxId} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">
              {t("amountLabel")} <span className="text-accent">*</span>
            </Label>
            <Input
              id="amount"
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">{t("noteLabel")}</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("notePlaceholder")} rows={2} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <PartyBalancePreview
          documentType={documentType}
          partyName={selectedParty?.label ?? ""}
          currentBalance={currentBalance}
          amount={amount}
        />
        <Button type="submit" variant="accent" size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
