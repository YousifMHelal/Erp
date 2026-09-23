import { useTranslations } from "next-intl";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StocktakeLineRow } from "@/components/inventory/stocktake/stocktake-line-row";
import { StocktakeLineMobileCard } from "@/components/inventory/stocktake/stocktake-line-mobile-card";
import type { StocktakeSheetProps } from "@/types";

export function StocktakeSheet({ lines, onUpdateCounted }: StocktakeSheetProps) {
  const t = useTranslations("inventory.stocktake");

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="hidden md:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 text-label">{t("columnProduct")}</TableHead>
              <TableHead className="h-8 text-label">{t("columnUnit")}</TableHead>
              <TableHead className="h-8 text-label">{t("columnSystem")}</TableHead>
              <TableHead className="h-8 text-label">{t("columnCounted")}</TableHead>
              <TableHead className="h-8 text-label text-end">{t("columnDifference")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <StocktakeLineRow
                key={line.id}
                line={line}
                onUpdateCounted={(qty) => onUpdateCounted(line.id, qty)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 p-3 md:hidden">
        {lines.map((line) => (
          <StocktakeLineMobileCard key={line.id} line={line} onUpdateCounted={(qty) => onUpdateCounted(line.id, qty)} />
        ))}
      </div>
    </div>
  );
}
