import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { History } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StockMovementTableProps } from "@/types";

export function StockMovementTable({ movements }: StockMovementTableProps) {
  const t = useTranslations("inventory.detail");
  const tType = useTranslations("inventory.movementType");

  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="border-b border-border px-4 py-3">
        <CardTitle>{t("movementHistoryTitle")}</CardTitle>
      </CardHeader>
      {movements.length === 0 ? (
        <EmptyState icon={<History className="size-6" />} title={t("movementHistoryEmpty")} />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-label">{t("columnDate")}</TableHead>
                  <TableHead className="text-label">{t("columnType")}</TableHead>
                  <TableHead className="text-label">{t("columnQty")}</TableHead>
                  <TableHead className="text-label">{t("columnBalanceAfter")}</TableHead>
                  <TableHead className="text-label">{t("columnRef")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="tabular-nums">{formatDate(movement.createdAt)}</TableCell>
                    <TableCell>{tType(movement.type)}</TableCell>
                    <TableCell
                      className={cn(
                        "tabular-nums font-medium",
                        movement.qtyInSub > 0 ? "text-success-fg" : "text-danger-fg",
                      )}
                    >
                      {movement.qtyInSub > 0 ? "+" : ""}
                      {formatNumber(movement.qtyInSub)}
                    </TableCell>
                    <TableCell className="tabular-nums">{formatNumber(movement.balanceAfter)}</TableCell>
                    <TableCell className="text-muted-foreground">{movement.refLabel}</TableCell>
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
                  <span
                    className={cn(
                      "tabular-nums font-medium",
                      movement.qtyInSub > 0 ? "text-success-fg" : "text-danger-fg",
                    )}
                  >
                    {movement.qtyInSub > 0 ? "+" : ""}
                    {formatNumber(movement.qtyInSub)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-body-sm text-muted-foreground">
                  <span>{movement.refLabel}</span>
                  <span className="tabular-nums">{formatDate(movement.createdAt)}</span>
                </div>
                <span className="text-caption text-muted-foreground">
                  {t("columnBalanceAfter")}: <span className="tabular-nums">{formatNumber(movement.balanceAfter)}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
