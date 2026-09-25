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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatMoney } from "@/lib/format";
import { createCollection, updateCollection } from "@/actions/collections.actions";
import { createPayment, updatePayment } from "@/actions/payments.actions";
import { createCollectionSchema, createPaymentSchema } from "@/lib/validations";
import type { MoneyDocumentFormProps } from "@/types";

export function MoneyDocumentForm({ documentType, partyOptions, cashboxOptions, editing }: MoneyDocumentFormProps) {
  const t = useTranslations("moneyDocuments.form");
  const tList = useTranslations("moneyDocuments.list");
  const tInvoice = useTranslations("invoices.form");
  const router = useRouter();
  const isEdit = !!editing;
  const [partyId, setPartyId] = useState<string | undefined>(editing?.partyId);
  const [cashboxId, setCashboxId] = useState<string | undefined>(editing?.cashboxId ?? cashboxOptions[0]?.value);
  const [amount, setAmount] = useState(editing?.amount ?? "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [negativeCashWarning, setNegativeCashWarning] = useState<{ cashboxName: string; balanceAfter: number } | null>(
    null,
  );

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

    const cashbox = cashboxOptions.find((option) => option.value === cashboxId);
    if (documentType === "PAYMENT" && cashbox?.balance !== undefined) {
      // On edit, this payment's old amount goes back into its cashbox before the new one comes out.
      const refunded = isEdit && editing.cashboxId === cashboxId ? Number(editing.amount) : 0;
      const balanceAfter = Number(cashbox.balance) + refunded - Number(amount);
      if (balanceAfter < 0) {
        setNegativeCashWarning({ cashboxName: cashbox.label, balanceAfter });
        return;
      }
    }
    await submit();
  }

  async function submit() {
    setNegativeCashWarning(null);
    const input = documentType === "COLLECTION"
      ? { customerId: partyId, cashboxId, amount, note }
      : { supplierId: partyId, cashboxId, amount, note };
    setSaving(true);
    try {
      const result = isEdit
        ? documentType === "COLLECTION"
          ? await updateCollection({ ...input, id: editing.id })
          : await updatePayment({ ...input, id: editing.id })
        : documentType === "COLLECTION"
          ? await createCollection(input)
          : await createPayment(input);
      if (!result.success) return toast.error(result.error);
    } finally {
      setSaving(false);
    }
    toast.success(
      isEdit
        ? documentType === "COLLECTION" ? tList("collectionUpdated") : tList("paymentUpdated")
        : documentType === "COLLECTION" ? t("collectionSaved") : t("paymentSaved"),
    );
    router.push(documentType === "COLLECTION" ? "/collections" : "/payments");
  }

  const title = isEdit
    ? documentType === "COLLECTION" ? tList("editCollectionTitle") : tList("editPaymentTitle")
    : documentType === "COLLECTION" ? t("newCollectionTitle") : t("newPaymentTitle");
  const partyLabel = documentType === "COLLECTION" ? t("customerLabel") : t("supplierLabel");
  const partyPlaceholder = documentType === "COLLECTION" ? t("customerPlaceholder") : t("supplierPlaceholder");
  const submitLabel = documentType === "COLLECTION" ? t("saveCollection") : t("savePayment");

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="min-w-0">
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
              placeholder="0.00"
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
      <ConfirmDialog
        open={negativeCashWarning !== null}
        onOpenChange={(open) => !open && setNegativeCashWarning(null)}
        title={tInvoice("negativeCashTitle")}
        description={
          negativeCashWarning
            ? tInvoice("negativeCashDescription", {
                cashbox: negativeCashWarning.cashboxName,
                balance: formatMoney(String(negativeCashWarning.balanceAfter)),
              })
            : ""
        }
        confirmLabel={tInvoice("negativeCashConfirm")}
        isPending={saving}
        onConfirm={() => void submit()}
      />
    </form>
  );
}
