import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { History, ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { ProductPriceHistoryProps } from "@/types";

export function ProductPriceHistory({ entries }: ProductPriceHistoryProps) {
  const t = useTranslations("inventory.detail");

  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="border-b border-border px-4 py-3">
        <CardTitle>{t("priceHistoryTitle")}</CardTitle>
      </CardHeader>
      {entries.length === 0 ? (
        <EmptyState icon={<History className="size-6" />} title={t("priceHistoryEmpty")} />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-label">{t("columnDate")}</TableHead>
                  <TableHead className="text-label">{t("columnField")}</TableHead>
                  <TableHead className="text-label">{t("columnOldValue")}</TableHead>
                  <TableHead className="text-label">{t("columnNewValue")}</TableHead>
                  <TableHead className="text-label">{t("columnChangedBy")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="tabular-nums">{formatDate(entry.changedAt)}</TableCell>
                    <TableCell>{entry.fieldLabel}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground line-through">{entry.oldValue}</TableCell>
                    <TableCell className="font-medium tabular-nums">{entry.newValue}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.changedByName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col divide-y divide-border md:hidden">
            {entries.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-1.5 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{entry.fieldLabel}</span>
                  <span className="tabular-nums text-caption text-muted-foreground">{formatDate(entry.changedAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-body-sm">
                  <span className="tabular-nums text-muted-foreground line-through">{entry.oldValue}</span>
                  <ArrowLeft className="size-3.5 shrink-0 rtl:rotate-180 text-muted-foreground" aria-hidden="true" />
                  <span className="font-medium tabular-nums">{entry.newValue}</span>
                </div>
                <span className="text-caption text-muted-foreground">{entry.changedByName}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
