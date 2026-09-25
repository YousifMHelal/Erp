import { cn } from "@/lib/utils";
import type { ReportPrintColumn, ReportPrintTableProps } from "@/types";

const CELL = "border-[1.2px] border-[#8a8a8a] px-[1.5mm] py-[1mm] align-middle leading-snug";

function cellClass(column: ReportPrintColumn) {
  return cn(CELL, column.numeric ? "text-center whitespace-nowrap" : "text-start");
}

/** Print-only report table in the invoice products-table design: bordered cells, grey header, row numbers, repeating header. */
export function ReportPrintTable({ columns, rows, footerRow }: ReportPrintTableProps) {
  return (
    <table className="w-full border-collapse text-[14.5px]">
      <thead className="table-header-group">
        <tr className="break-inside-avoid">
          {/* row-number column intentionally has NO border, like the invoice products table */}
          <th className="w-[8mm] border-0 bg-white p-0" />
          {columns.map((column) => (
            <th
              key={column.key}
              className={cn(CELL, "bg-[#f2f2f2] text-center text-[13.5px] font-bold")}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="break-inside-avoid">
            <td className="border-0 px-0 text-center align-middle text-[12.5px]">{index + 1}</td>
            {columns.map((column) => (
              <td key={column.key} className={cellClass(column)} dir={column.numeric ? "ltr" : undefined}>
                {row[column.key]}
              </td>
            ))}
          </tr>
        ))}
        {footerRow ? (
          <tr className="break-inside-avoid font-bold">
            <td className="border-0 p-0" />
            {columns.map((column) => (
              <td
                key={column.key}
                className={cn(cellClass(column), "bg-[#f2f2f2]")}
                dir={column.numeric ? "ltr" : undefined}
              >
                {footerRow[column.key]}
              </td>
            ))}
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}
