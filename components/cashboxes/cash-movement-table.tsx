import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { History } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { CashMovementTableProps } from "@/types";

export function CashMovementTable({ movements }: CashMovementTableProps) {
  const t = useTranslations("cashboxes");
  const tType = useTranslations("cashboxes.movementType");

  if (movements.length === 0) {
    return <EmptyState icon={<History className="size-6" />} title={t("movementsEmpty")} />;
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="hidden md:block">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-label">{t("columnDate")}</TableHead>
              <TableHead className="text-label">{t("columnCashbox")}</TableHead>
              <TableHead className="text-label">{t("columnType")}</TableHead>
              <TableHead className="text-label">{t("columnParty")}</TableHead>
              <TableHead className="text-label">{t("columnRef")}</TableHead>
              <TableHead className="text-label text-end">{t("columnAmount")}</TableHead>
              <TableHead className="text-label text-end">{t("columnBalanceAfter")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell className="tabular-nums">{formatDate(movement.createdAt)}</TableCell>
                <TableCell>{movement.cashboxName}</TableCell>
                <TableCell>{tType(movement.type)}</TableCell>
                <TableCell className="text-muted-foreground">{movement.partyName ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{movement.refLabel}</TableCell>
                <TableCell className="text-end">
                  <Money value={String(movement.amount)} sign />
                </TableCell>
                <TableCell className="text-end font-medium tabular-nums">
                  <Money value={movement.balanceAfter} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col divide-y divide-border md:hidden">
        {movements.map((movement) => (
          <div key={movement.id} className="flex flex-col gap-1.5 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{tType(movement.type)}</span>
              <Money value={String(movement.amount)} sign className="font-medium" />
            </div>
            <div className="flex items-center justify-between text-body-sm text-muted-foreground">
              <span>{movement.cashboxName}</span>
              <span className="tabular-nums">{formatDate(movement.createdAt)}</span>
            </div>
            {movement.partyName && <span className="text-caption text-muted-foreground">{movement.partyName}</span>}
            <span className="text-caption text-muted-foreground">{movement.refLabel}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
