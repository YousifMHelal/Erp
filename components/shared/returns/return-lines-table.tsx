import { useTranslations } from "next-intl";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/shared/money";
import { EmptyState } from "@/components/shared/empty-state";
import { PackageSearch } from "lucide-react";
import { formatMoney, formatNumber } from "@/lib/format";
import type { ReturnLinesTableProps } from "@/types";

export function ReturnLinesTable({ lines, onUpdateQty }: ReturnLinesTableProps) {
  const t = useTranslations("returns.form");
  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  if (lines.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border p-8">
        <EmptyState icon={<PackageSearch className="size-6" />} title={t("selectInvoiceHint")} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-label">{t("columnProduct")}</TableHead>
            <TableHead className="text-label">{t("columnUnit")}</TableHead>
            <TableHead className="text-label">{t("columnQtyInvoiced")}</TableHead>
            <TableHead className="text-label">{t("columnQtyReturn")}</TableHead>
            <TableHead className="text-label">{t("columnPrice")}</TableHead>
            <TableHead className="text-label text-end">{t("columnTotal")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.lineId}>
              <TableCell className="font-medium">{line.productName}</TableCell>
              <TableCell>{line.unitName}</TableCell>
              <TableCell className="tabular-nums">{formatNumber(line.maxReturnableQty)}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={line.maxReturnableQty}
                  step="any"
                  value={line.qty}
                  onChange={(e) => {
                    const value = Math.min(Math.max(Number(e.target.value), 0), line.maxReturnableQty);
                    onUpdateQty(line.lineId, value);
                  }}
                  className="w-20 text-end tabular-nums"
                  aria-label={t("columnQtyReturn")}
                />
              </TableCell>
              <TableCell>
                <Money value={String(line.unitPrice)} />
              </TableCell>
              <TableCell className="text-end font-medium">
                <Money value={String(line.lineTotal)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={5} className="font-medium">
              {t("totalLabel")}
            </TableCell>
            <TableCell className="text-end font-medium tabular-nums">{formatMoney(String(total))}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
