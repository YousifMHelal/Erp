import { useTranslations } from "next-intl";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StocktakeDetail } from "@/types";

export function StocktakeDetailView({ stocktake }: { stocktake: StocktakeDetail }) {
  const t = useTranslations("inventory.stocktake");

  return (
    <div className="flex flex-col gap-4">
      {stocktake.note && (
        <Card>
          <CardContent className="text-body-sm text-muted-foreground">
            {t("noteLabel")}: {stocktake.note}
          </CardContent>
        </Card>
      )}
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-label">{t("columnProduct")}</TableHead>
              <TableHead className="text-label">{t("columnUnit")}</TableHead>
              <TableHead className="text-label">{t("columnSystem")}</TableHead>
              <TableHead className="text-label">{t("columnCounted")}</TableHead>
              <TableHead className="text-label text-end">{t("columnDifference")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocktake.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="font-medium">{line.productName}</TableCell>
                <TableCell>{line.unitName}</TableCell>
                <TableCell className="tabular-nums">{formatNumber(line.systemQty)}</TableCell>
                <TableCell className="tabular-nums">{formatNumber(line.countedQty)}</TableCell>
                <TableCell
                  className={cn(
                    "text-end tabular-nums font-medium",
                    line.difference > 0 && "text-success-fg",
                    line.difference < 0 && "text-danger-fg",
                  )}
                >
                  {line.difference > 0 ? "+" : ""}
                  {formatNumber(line.difference)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
