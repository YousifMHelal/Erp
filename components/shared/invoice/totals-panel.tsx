import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Money } from "@/components/shared/money";
import type { TotalsPanelProps } from "@/types";

export function TotalsPanel({ subtotal, discountAmount, onDiscountChange, total }: TotalsPanelProps) {
  const t = useTranslations("invoices.form");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("totalsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-body-sm">
          <span className="text-muted-foreground">{t("subtotalLabel")}</span>
          <Money value={String(subtotal)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="discount-amount">{t("discountLabel")}</Label>
          <NumberInput
            id="discount-amount"
            min={0}
            value={discountAmount}
            onValueChange={onDiscountChange}
            placeholder="0.00"
            className="text-end tabular-nums"
          />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-h3 font-semibold">{t("totalLabel")}</span>
          <span className="text-h2 tabular-nums">
            <Money value={String(total)} />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
