import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ReportTableProps } from "@/types";

export function ReportTable({ columns, rows, footerRow }: ReportTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col.key} className={cn("text-label", col.align === "end" && "text-end")}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn(col.align === "end" && "text-end")}>
                    {row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          {footerRow && (
            <TableFooter>
              <TableRow className="hover:bg-transparent">
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn("font-medium", col.align === "end" && "text-end")}>
                    {footerRow[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </Card>
  );
}
