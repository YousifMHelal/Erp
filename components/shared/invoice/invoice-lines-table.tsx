import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Money } from "@/components/shared/money";
import { formatNumber } from "@/lib/format";
import type { InvoiceLinesTableProps } from "@/types";

export function InvoiceLinesTable({ lines }: InvoiceLinesTableProps) {
  const t = useTranslations("invoices.detail");

  return (
    <Card className="overflow-hidden p-0">
      <div className="hidden md:block">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-14 pe-6 text-center text-label">#</TableHead>
              <TableHead className="text-label">{t("columnProduct")}</TableHead>
              <TableHead className="text-center text-label">{t("columnUnit")}</TableHead>
              <TableHead className="text-center text-label">{t("columnQty")}</TableHead>
              <TableHead className="text-center text-label">{t("columnPrice")}</TableHead>
              <TableHead className="text-center text-label">{t("columnTotal")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, index) => (
              <TableRow key={line.id}>
                <TableCell className="w-14 pe-6 text-center text-muted-foreground tabular-nums">{index + 1}</TableCell>
                <TableCell className="font-medium">{line.productName}</TableCell>
                <TableCell className="text-center">{line.unitName}</TableCell>
                <TableCell className="text-center tabular-nums">{formatNumber(line.qty)}</TableCell>
                <TableCell className="text-center">
                  <Money value={line.unitPrice} />
                </TableCell>
                <TableCell className="text-center font-medium">
                  <Money value={line.lineTotal} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col divide-y divide-border md:hidden">
        {lines.map((line) => (
          <div key={line.id} className="flex flex-col gap-1.5 p-4">
            <span className="font-medium">{line.productName}</span>
            <div className="flex items-center justify-between text-body-sm text-muted-foreground">
              <span>
                {formatNumber(line.qty)} {line.unitName} × <Money value={line.unitPrice} />
              </span>
              <Money value={line.lineTotal} className="font-medium text-foreground" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
