import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ReportTableProps } from "@/types";

export function ReportTable({ columns, rows, footerRow }: ReportTableProps) {
  const [identityColumn, ...restColumns] = columns;

  return (
    <Card className="overflow-hidden p-0">
      <div className="hidden overflow-x-auto md:block">
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

      <div className="flex flex-col divide-y divide-border md:hidden">
        {rows.map((row, index) => (
          <div key={index} className="flex flex-col gap-1.5 p-4">
            {identityColumn && <span className="font-medium">{row[identityColumn.key]}</span>}
            {restColumns.map((col) => (
              <div key={col.key} className="flex items-center justify-between text-body-sm">
                <span className="text-muted-foreground">{col.label}</span>
                <span>{row[col.key]}</span>
              </div>
            ))}
          </div>
        ))}
        {footerRow && (
          <div className="flex flex-col gap-1.5 bg-muted/50 p-4 font-medium">
            {identityColumn && <span>{footerRow[identityColumn.key]}</span>}
            {restColumns.map((col) => (
              <div key={col.key} className="flex items-center justify-between text-body-sm">
                <span className="text-muted-foreground">{col.label}</span>
                <span>{footerRow[col.key]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
