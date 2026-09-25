import Link from "next/link";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CustomerInvoicesTabProps } from "@/types";

const PAYMENT_STATUS_TONE = { PAID: "success", PARTIAL: "warning", UNPAID: "danger" } as const;

export function CustomerInvoicesTab({ partyType, invoices }: CustomerInvoicesTabProps) {
  const t = useTranslations("parties.detail");
  const tStatus = useTranslations("invoices.paymentStatus");
  const basePath = partyType === "CUSTOMER" ? "/sales" : "/purchases";

  if (invoices.length === 0) {
    return <EmptyState icon={<FileText className="size-6" />} title={t("invoicesEmpty")} />;
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-label">{t("columnDate")}</TableHead>
              <TableHead className="text-label">{t("columnNumber")}</TableHead>
              <TableHead className="text-label">{t("columnPaymentStatus")}</TableHead>
              <TableHead className="text-center text-label">{t("columnTotal")}</TableHead>
              <TableHead className="text-center text-label">{t("columnPaid")}</TableHead>
              <TableHead className="text-center text-label">{t("columnRemaining")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="tabular-nums">{formatDate(invoice.issuedAt)}</TableCell>
                <TableCell>
                  <Link
                    href={`${basePath}/${invoice.id}`}
                    className={cn(
                      "font-medium text-primary hover:underline",
                      invoice.status === "CANCELLED" && "text-muted-foreground line-through",
                    )}
                  >
                    #{String(invoice.number).padStart(6, "0")}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge tone={PAYMENT_STATUS_TONE[invoice.paymentStatus]} label={tStatus(invoice.paymentStatus)} />
                </TableCell>
                <TableCell className="text-center">
                  <Money value={invoice.total} />
                </TableCell>
                <TableCell className="text-center">
                  <Money value={invoice.paidAmount} className="text-success-fg" />
                </TableCell>
                <TableCell className="text-center">
                  <Money value={invoice.remainingAmount} className={Number(invoice.remainingAmount) > 0 ? "text-danger-fg" : undefined} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {invoices.map((invoice) => (
          <Link key={invoice.id} href={`${basePath}/${invoice.id}`}>
            <Card>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={cn("font-medium", invoice.status === "CANCELLED" && "text-muted-foreground line-through")}>
                    #{String(invoice.number).padStart(6, "0")}
                  </span>
                  <StatusBadge tone={PAYMENT_STATUS_TONE[invoice.paymentStatus]} label={tStatus(invoice.paymentStatus)} />
                </div>
                <div className="flex items-center justify-between text-body-sm text-muted-foreground">
                  <span className="tabular-nums">{formatDate(invoice.issuedAt)}</span>
                  <Money value={invoice.total} className="font-medium text-foreground" />
                </div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-muted-foreground">
                    {t("columnPaid")}: <Money value={invoice.paidAmount} className="text-success-fg" />
                  </span>
                  <span className="text-muted-foreground">
                    {t("columnRemaining")}:{" "}
                    <Money value={invoice.remainingAmount} className={Number(invoice.remainingAmount) > 0 ? "text-danger-fg" : undefined} />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
