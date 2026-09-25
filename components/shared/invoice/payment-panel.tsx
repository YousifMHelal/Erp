import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import { Money } from "@/components/shared/money";
import { StatusBadge } from "@/components/shared/status-badge";
import type { PaymentPanelProps } from "@/types";

export function PaymentPanel({
  documentType,
  cashboxOptions,
  cashboxId,
  onCashboxChange,
  partyOptions,
  partyId,
  onPartyChange,
  paidAmount,
  onPaidAmountChange,
  total,
}: PaymentPanelProps) {
  const t = useTranslations("invoices.form");
  const remaining = total - paidAmount;
  const status = remaining <= 0 ? "PAID" : paidAmount <= 0 ? "UNPAID" : "PARTIAL";
  const statusTone = status === "PAID" ? "success" : status === "PARTIAL" ? "warning" : "danger";
  const tStatus = useTranslations("invoices.paymentStatus");
  const partyLabel = documentType === "SALE" ? t("partyLabelSale") : t("partyLabelPurchase");
  const cashPartyPlaceholder = documentType === "SALE" ? t("cashPartyPlaceholderSale") : t("cashPartyPlaceholderPurchase");
  const partySearchPlaceholder =
    documentType === "SALE" ? t("partySearchPlaceholderSale") : t("partySearchPlaceholderPurchase");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("paymentTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>{partyLabel}</Label>
          <EntityCombobox
            options={partyOptions}
            value={partyId}
            onChange={onPartyChange}
            placeholder={cashPartyPlaceholder}
            searchPlaceholder={partySearchPlaceholder}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("cashboxLabel")}</Label>
          <EntityCombobox
            options={cashboxOptions}
            value={cashboxId}
            onChange={onCashboxChange}
            placeholder={t("cashboxPlaceholder")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="paid-amount">{t("paidAmountLabel")}</Label>
          <NumberInput
            id="paid-amount"
            min={0}
            value={paidAmount}
            onValueChange={onPaidAmountChange}
            placeholder="0.00"
            className="text-end tabular-nums"
          />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-body-sm text-muted-foreground">{t("remainingLabel")}</span>
          <Money value={String(Math.max(remaining, 0))} className="font-medium" />
        </div>
        <StatusBadge tone={statusTone} label={tStatus(status)} className="w-fit" />
      </CardContent>
    </Card>
  );
}
