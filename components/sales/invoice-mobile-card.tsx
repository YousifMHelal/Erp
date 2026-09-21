import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import { useTranslations } from "next-intl";
import type { InvoiceListRow } from "@/types";

const PAYMENT_STATUS_TONE = { PAID: "success", PARTIAL: "warning", UNPAID: "danger" } as const;

export function InvoiceMobileCard({ invoice }: { invoice: InvoiceListRow }) {
  const t = useTranslations("invoices.paymentStatus");
  const tCommon = useTranslations("common");

  return (
    <Link href={`/sales/${invoice.id}`}>
      <Card className={invoice.status === "CANCELLED" ? "opacity-60" : undefined}>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={`font-medium ${invoice.status === "CANCELLED" ? "line-through" : ""}`}>
              #{String(invoice.number).padStart(6, "0")}
            </span>
            <StatusBadge tone={PAYMENT_STATUS_TONE[invoice.paymentStatus]} label={t(invoice.paymentStatus)} />
          </div>
          <span className="text-body-sm text-muted-foreground">{invoice.partyName}</span>
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="text-caption text-muted-foreground">{formatDate(invoice.issuedAt)}</span>
            <Money value={invoice.total} className="font-medium" />
          </div>
          <span className="text-caption text-muted-foreground">
            {invoice.cashboxName} · {invoice.userName}
          </span>
          <span className="sr-only">{tCommon("view")}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
