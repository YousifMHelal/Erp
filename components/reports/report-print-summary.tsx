import type { ReportPrintSummaryProps } from "@/types";

/** Print-only row of bordered totals boxes (grey label cell over the value), like the invoice totals box. */
export function ReportPrintSummary({ items }: ReportPrintSummaryProps) {
  if (!items.length) return null;

  return (
    <table className="mt-[1mm] w-full table-fixed border-collapse break-inside-avoid">
      <tbody>
        <tr>
          {items.map((item) => (
            <th
              key={item.label}
              className="border-[1.2px] border-[#8a8a8a] bg-[#f2f2f2] px-[1mm] py-[1mm] text-center align-middle text-[12.5px] leading-tight font-bold"
            >
              {item.label}
            </th>
          ))}
        </tr>
        <tr>
          {items.map((item) => (
            <td
              key={item.label}
              className="border-[1.2px] border-[#8a8a8a] px-[1mm] py-[1.5mm] text-center align-middle text-[15px] font-bold whitespace-nowrap"
              dir="ltr"
            >
              {item.value}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
