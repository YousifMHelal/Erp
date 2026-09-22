"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import { PartyBalancePreview } from "@/components/shared/money-document/party-balance-preview";
import { createCollection } from "@/actions/collections.actions";
import { createPayment } from "@/actions/payments.actions";
import { createCollectionSchema, createPaymentSchema } from "@/lib/validations";
import type { MoneyDocumentFormProps } from "@/types";

export function MoneyDocumentForm({ documentType, partyOptions, cashboxOptions }: MoneyDocumentFormProps) {
  const t = useTranslations("moneyDocuments.form");
  const router = useRouter();
  const [partyId, setPartyId] = useState<string | undefined>(undefined);
  const [cashboxId, setCashboxId] = useState<string | undefined>(cashboxOptions[0]?.value);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedParty = partyOptions.find((p) => p.value === partyId);
  const currentBalance = selectedParty?.balance ?? "0";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = documentType === "COLLECTION"
      ? { customerId: partyId, cashboxId, amount, note }
      : { supplierId: partyId, cashboxId, amount, note };
    const parsed = documentType === "COLLECTION"
      ? createCollectionSchema.safeParse(input)
      : createPaymentSchema.safeParse(input);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? t("errorRequired"));
    setSaving(true);
    try {
      const result = documentType === "COLLECTION"
        ? await createCollection(input) : await createPayment(input);
      if (!result.success) return toast.error(result.error);
    } finally {
      setSaving(false);
    }
    toast.success(documentType === "COLLECTION" ? t("collectionSaved") : t("paymentSaved"));
    router.push(documentType === "COLLECTION" ? "/collections" : "/payments");
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
              onChange={(e) => setAmount(e.target.value)}
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
        <Button type="submit" variant="accent" size="lg" disabled={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
