import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { InvoiceHeaderCardProps } from "@/types";

const PAYMENT_STATUS_TONE = { PAID: "success", PARTIAL: "warning", UNPAID: "danger" } as const;

export function InvoiceHeaderCard({ invoice }: InvoiceHeaderCardProps) {
  const t = useTranslations("sales.detail");
  const tStatus = useTranslations("invoices.paymentStatus");
  const isCancelled = invoice.status === "CANCELLED";

  return (
    <Card>
      <CardContent className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className={cn("text-h1", isCancelled && "text-muted-foreground line-through")}>
            #{String(invoice.number).padStart(6, "0")}
          </span>
          <span className="text-body-sm text-muted-foreground">
            {formatDate(invoice.issuedAt)} · {invoice.userName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isCancelled && <StatusBadge tone="danger" label={t("cancelledLabel")} />}
          <StatusBadge tone={PAYMENT_STATUS_TONE[invoice.paymentStatus]} label={tStatus(invoice.paymentStatus)} />
        </div>
      </CardContent>
    </Card>
  );
}
