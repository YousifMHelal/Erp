import { HandCoins } from "lucide-react";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { formatDate } from "@/lib/format";
import type { CustomerPaymentsTabProps } from "@/types";

export function CustomerPaymentsTab({ payments }: CustomerPaymentsTabProps) {
  const t = useTranslations("parties.detail");

  if (payments.length === 0) {
    return <EmptyState icon={<HandCoins className="size-6" />} title={t("paymentsEmpty")} />;
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-label">{t("columnDate")}</TableHead>
              <TableHead className="text-label">{t("columnNumber")}</TableHead>
              <TableHead className="text-label">{t("columnCashbox")}</TableHead>
              <TableHead className="text-label text-end">{t("columnAmount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="tabular-nums">{formatDate(payment.occurredAt)}</TableCell>
                <TableCell className="font-medium">#{String(payment.number).padStart(5, "0")}</TableCell>
                <TableCell>{payment.cashboxName}</TableCell>
                <TableCell className="text-end">
                  <Money value={payment.amount} sign />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {payments.map((payment) => (
          <Card key={payment.id}>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">#{String(payment.number).padStart(5, "0")}</span>
                <Money value={payment.amount} sign className="font-medium" />
              </div>
              <div className="flex items-center justify-between text-body-sm text-muted-foreground">
                <span>{payment.cashboxName}</span>
                <span className="tabular-nums">{formatDate(payment.occurredAt)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
