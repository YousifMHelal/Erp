import Link from "next/link";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import type { RecentInvoicesProps } from "@/types";

const PAYMENT_STATUS_TONE = {
  PAID: "success",
  PARTIAL: "warning",
  UNPAID: "danger",
} as const;

export function RecentInvoices({ items }: RecentInvoicesProps) {
  const t = useTranslations("dashboard");
  const tStatus = useTranslations("invoices.paymentStatus");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("recentInvoicesTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {items.length === 0 ? (
          <EmptyState icon={<FileText className="size-6" />} title={t("recentInvoicesEmpty")} />
        ) : (
          items.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/sales/${invoice.id}`}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-body-sm font-medium">
                  #{String(invoice.number).padStart(6, "0")} — {invoice.partyName}
                </span>
                <span className="text-caption text-muted-foreground">{formatDate(invoice.issuedAt)}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Money value={invoice.total} />
                <StatusBadge tone={PAYMENT_STATUS_TONE[invoice.paymentStatus]} label={tStatus(invoice.paymentStatus)} />
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
