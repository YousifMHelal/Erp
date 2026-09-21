import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import { Money } from "@/components/shared/money";
import { StatusBadge } from "@/components/shared/status-badge";
import type { PaymentPanelProps } from "@/types";

export function PaymentPanel({
  cashboxOptions,
  cashboxId,
  onCashboxChange,
  customerOptions,
  customerId,
  onCustomerChange,
  paidAmount,
  onPaidAmountChange,
  total,
}: PaymentPanelProps) {
  const t = useTranslations("sales.new");
  const remaining = total - paidAmount;
  const status = remaining <= 0 ? "PAID" : paidAmount <= 0 ? "UNPAID" : "PARTIAL";
  const statusTone = status === "PAID" ? "success" : status === "PARTIAL" ? "warning" : "danger";
  const tStatus = useTranslations("invoices.paymentStatus");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("paymentTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>{t("customerLabel")}</Label>
          <EntityCombobox
            options={customerOptions}
            value={customerId}
            onChange={onCustomerChange}
            placeholder={t("cashCustomerPlaceholder")}
            searchPlaceholder={t("customerSearchPlaceholder")}
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
          <Input
            id="paid-amount"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={paidAmount}
            onChange={(e) => onPaidAmountChange(Number(e.target.value))}
            placeholder="٠٫٠٠"
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
