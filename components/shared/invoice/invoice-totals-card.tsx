import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import type { InvoiceTotalsCardProps } from "@/types";

export function InvoiceTotalsCard({ invoice }: InvoiceTotalsCardProps) {
  const t = useTranslations("invoices.detail");

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <Row label={t("subtotalLabel")} value={invoice.subtotal} />
        {Number(invoice.discountAmount) > 0 && <Row label={t("discountLabel")} value={invoice.discountAmount} negative />}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-h3 font-semibold">{t("totalLabel")}</span>
          <Money value={invoice.total} className="text-display" />
        </div>
        <Row label={t("paidLabel")} value={invoice.paidAmount} />
        <Row label={t("remainingLabel")} value={invoice.remainingAmount} emphasize />
      </CardContent>
    </Card>
  );
}

function Row({ label, value, negative, emphasize }: { label: string; value: string; negative?: boolean; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between text-body-sm">
      <span className="text-muted-foreground">{label}</span>
      <Money value={negative ? `-${value}` : value} className={emphasize ? "font-medium" : undefined} />
    </div>
  );
}
