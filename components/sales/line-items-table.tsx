import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableFooter, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { LineRow } from "@/components/sales/line-row";
import { LineItemMobileCard } from "@/components/sales/line-item-mobile-card";
import { formatMoney } from "@/lib/format";
import type { LineItemsTableProps } from "@/types";

export function LineItemsTable({ lines, onUpdateLine, onRemoveLine, activeLineId }: LineItemsTableProps) {
  const t = useTranslations("sales.new");
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  if (lines.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border">
        <EmptyState icon={<ShoppingCart className="size-6" />} title={t("emptyLines")} description={t("emptyLinesHint")} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-border">
      <div className="hidden flex-1 overflow-y-auto md:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-full text-label">{t("columnProduct")}</TableHead>
              <TableHead className="text-label whitespace-nowrap">{t("columnUnit")}</TableHead>
              <TableHead className="text-label whitespace-nowrap">{t("columnQty")}</TableHead>
              <TableHead className="text-label whitespace-nowrap">{t("columnPrice")}</TableHead>
              <TableHead className="text-label text-end whitespace-nowrap">{t("columnTotal")}</TableHead>
              <TableHead className="w-10 whitespace-nowrap" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <LineRow
                key={line.lineId}
                line={line}
                isActive={line.lineId === activeLineId}
                onUpdate={(patch) => onUpdateLine(line.lineId, patch)}
                onRemove={() => onRemoveLine(line.lineId)}
              />
            ))}
          </TableBody>
          <TableFooter className="sticky bottom-0">
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="font-medium">
                {t("subtotalLabel")}
              </TableCell>
              <TableCell className="text-end font-medium tabular-nums">{formatMoney(String(subtotal))}</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 md:hidden">
        {lines.map((line) => (
          <LineItemMobileCard
            key={line.lineId}
            line={line}
            isActive={line.lineId === activeLineId}
            onUpdate={(patch) => onUpdateLine(line.lineId, patch)}
            onRemove={() => onRemoveLine(line.lineId)}
          />
        ))}
      </div>
    </div>
  );
}
