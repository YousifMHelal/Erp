import { useTranslations } from "next-intl";
import { formatAmount, formatDate } from "@/lib/format";
import { resolveStatementFieldValue } from "@/lib/print-fields";
import type {
  PrintFieldItem,
  StatementLine,
  StatementPrintFieldData,
  StatementPrintLayoutProps,
  StatementPrintSize,
} from "@/types";

/** #, date, description, invoice total, debit, credit, balance after. */
type ColumnWidths = [string, string, string, string, string, string];

/** Per-size measurements, scaled from the invoice A4/A5 print layouts so statements match the shop template. */
const SIZE_STYLES: Record<
  StatementPrintSize,
  {
    page: string;
    header: string;
    title: string;
    shopName: string;
    info: string;
    metaColumn: string;
    partyColumn: string;
    partyLabel: string;
    infoRow: string;
    logo: string;
    tableWrap: string;
    table: string;
    /** Must sum to the table width (A4 207mm, A5 146mm). */
    columns: ColumnWidths;
    headRow: string;
    headCell: string;
    row: string;
    rowNumber: string;
    cell: string;
    totals: string;
    totalsRow: string;
    totalsValue: string;
    totalsLabel: string;
  }
> = {
  A4: {
    page: "w-[210mm]",
    header: "mx-[1.5mm] mt-[1.5mm] h-[11mm] px-[6mm]",
    title: "text-[24px]",
    shopName: "text-[20px]",
    info: "gap-[4mm] px-[5mm] pt-[3mm] pb-[2mm]",
    metaColumn: "w-[54mm] text-[16px] leading-[1.45]",
    partyColumn: "w-[72mm] text-[16px] leading-[1.5]",
    partyLabel: "text-[18px]",
    infoRow: "h-[4.5mm] gap-[2mm]",
    logo: "h-[24mm] w-[50mm]",
    tableWrap: "mx-[1.5mm] w-[207mm]",
    table: "w-[207mm]",
    columns: ["7.5mm", "24mm", "91.5mm", "27mm", "27mm", "30mm"],
    headRow: "h-[6.7mm]",
    headCell: "border-[1.2px] text-[14px]",
    row: "h-[9.2mm]",
    rowNumber: "text-[13px]",
    cell: "border-[1.2px] px-[1mm] text-[15.5px]",
    totals: "mx-[1.5mm] mt-[3mm] w-[207mm] pb-[3mm]",
    totalsRow: "min-h-[9mm] grid-cols-[50mm_1fr] w-[88mm]",
    totalsValue: "border-[1.2px] px-[1.5mm] text-[16px]",
    totalsLabel: "px-[2mm] text-[16px]",
  },
  A5: {
    page: "w-[148mm]",
    header: "mx-[1mm] mt-[1mm] h-[8mm] px-[4mm]",
    title: "text-[17px]",
    shopName: "text-[14px]",
    info: "gap-[3mm] px-[3.5mm] pt-[2mm] pb-[1.5mm]",
    metaColumn: "w-[42mm] text-[11px] leading-[1.4]",
    partyColumn: "w-[56mm] text-[11px] leading-[1.45]",
    partyLabel: "text-[12.5px]",
    infoRow: "h-[3.4mm] gap-[1.5mm]",
    logo: "h-[17mm] w-[32mm]",
    tableWrap: "mx-[1mm] w-[146mm]",
    table: "w-[146mm]",
    columns: ["5.5mm", "17mm", "63.5mm", "19.5mm", "19.5mm", "21mm"],
    headRow: "h-[5mm]",
    headCell: "border-[1px] text-[9.5px]",
    row: "h-[6.5mm]",
    rowNumber: "text-[9px]",
    cell: "border-[1px] px-[0.75mm] text-[10.5px]",
    totals: "mx-[1mm] mt-[2mm] w-[146mm] pb-[2mm]",
    totalsRow: "min-h-[6mm] grid-cols-[34mm_1fr] w-[60mm]",
    totalsValue: "border-[1px] px-[1mm] text-[11.5px]",
    totalsLabel: "px-[1.5mm] text-[11.5px]",
  },
};

/** `yyyy-MM-dd` → `dd/MM/yyyy`, formatted from the string so the server's timezone can't shift the day. */
function formatDay(day: string): string {
  return day.split("-").reverse().join("/");
}

/** Same look as the invoice layouts' InfoRow: bold "label :" then the value. */
function InfoRow({ label, value, className, valueDir = "ltr" }: {
  label: string;
  value: string;
  className: string;
  valueDir?: "ltr" | "rtl";
}) {
  return (
    <div className={`flex items-center justify-start whitespace-nowrap ${className}`} dir="rtl">
      {label && <span className="font-bold">{label + " :"}</span>}
      <span className="font-medium" dir={valueDir}>{value}</span>
    </div>
  );
}

/** A settings-configured field list, resolved against the statement and skipping empty rows. */
function ConfiguredFieldColumn({ items, data, rowClassName }: {
  items: PrintFieldItem[];
  data: StatementPrintFieldData;
  rowClassName: string;
}) {
  return (
    <div className="space-y-0">
      {items.map((item) => {
        const value = item.source.kind === "system"
          ? resolveStatementFieldValue(item.source.fieldKey, data)
          : item.source.value;
        if (!value) return null;
        return <InfoRow key={item.id} label={item.label} value={value} className={rowClassName} />;
      })}
    </div>
  );
}

function positiveAmountCell(value: string): string {
  return Number(value) > 0 ? formatAmount(value) : "";
}

/** Account statement in the shop's invoice print design (grey header bar, template info fields, bordered table, totals box). */
export function StatementPrintLayout({
  size,
  title,
  partyLabel,
  party,
  statement,
  printedAt,
  period,
  shop,
  infoColumns,
}: StatementPrintLayoutProps) {
  const t = useTranslations("parties.detail");
  const tPrint = useTranslations("print");
  const s = SIZE_STYLES[size];
  const fieldData: StatementPrintFieldData = {
    printedAt,
    party: { name: party.name, phone: party.phone, address: party.address },
    shop,
  };
  const periodLabel = period?.from && period.to
    ? `${formatDay(period.from)} – ${formatDay(period.to)}`
    : period?.from
      ? tPrint("statementPeriodFrom", { date: formatDay(period.from) })
      : period?.to
        ? tPrint("statementPeriodTo", { date: formatDay(period.to) })
        : undefined;
  const headers = [
    t("columnDate"),
    t("columnDescription"),
    t("columnDebit"),
    t("columnCredit"),
    t("columnBalanceAfter"),
  ];
  let rowNumber = 0;
  const numberOf = (line: StatementLine) => (line.isCarriedForward ? "" : String(++rowNumber));

  return (
    <div
      className={`invoice-a4 mx-auto overflow-hidden bg-white text-black ${s.page}`}
      dir="rtl"
      style={{
        fontFamily: "Arial, Tahoma, sans-serif",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <header className={`flex items-center justify-between bg-[#e5e5e5] ${s.header}`}>
        <span className={`leading-none font-bold ${s.title}`}>{title}</span>
        <span className={`leading-none font-bold ${s.shopName}`}>{shop.name}</span>
      </header>

      {/* RTL order, like the invoice: col 1 (right) template fields, col 2 (middle) party, col 3 (left) logo */}
      <section className={`flex items-start justify-between ${s.info}`} dir="rtl">
        <div className={s.metaColumn}>
          <ConfiguredFieldColumn items={infoColumns.col1} data={fieldData} rowClassName={s.infoRow} />
          {periodLabel && (
            <InfoRow label={tPrint("statementPeriod")} value={periodLabel} className={s.infoRow} valueDir="rtl" />
          )}
        </div>

        <div className={s.partyColumn}>
          <div className={`mb-[1mm] text-start font-bold ${s.partyLabel}`}>{partyLabel}</div>
          <ConfiguredFieldColumn items={infoColumns.col2} data={fieldData} rowClassName={s.infoRow} />
        </div>

        <div className={`flex shrink-0 items-center justify-start ${s.logo}`} dir="ltr">
          {shop.logoDataUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={shop.logoDataUrl} alt={shop.name} className="max-h-full max-w-full object-contain object-left" />
          )}
        </div>
      </section>

      <div className={s.tableWrap}>
        <table className={`table-fixed border-collapse ${s.table}`} dir="rtl">
          <colgroup>
            {s.columns.map((width, index) => (
              <col key={index} style={{ width }} />
            ))}
          </colgroup>
          <thead>
            <tr className={s.headRow}>
              {/* row-number column intentionally has NO border, like the invoice products table */}
              <th className="border-0 bg-white p-0" />
              {headers.map((label) => (
                <th
                  key={label}
                  className={`border-[#8a8a8a] bg-[#f2f2f2] px-[0.5mm] text-center align-middle leading-tight font-bold ${s.headCell}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statement.map((line) => (
              <tr key={line.id} className={`break-inside-avoid ${s.row}`}>
                <td className={`border-0 px-0 text-center align-middle font-normal ${s.rowNumber}`}>{numberOf(line)}</td>
                <td className={`border-[#8a8a8a] text-center align-middle ${s.cell}`} dir="ltr">
                  {formatDate(line.date)}
                </td>
                <td
                  className={`border-[#8a8a8a] text-start align-middle leading-tight ${line.isCarriedForward ? "font-bold" : ""} ${s.cell}`}
                >
                  {line.description}
                </td>
                <td className={`border-[#8a8a8a] text-center align-middle ${s.cell}`} dir="ltr">
                  {positiveAmountCell(line.debit)}
                </td>
                <td className={`border-[#8a8a8a] text-center align-middle ${s.cell}`} dir="ltr">
                  {positiveAmountCell(line.credit)}
                </td>
                <td className={`border-[#8a8a8a] text-center align-middle font-bold ${s.cell}`} dir="ltr">
                  {formatAmount(line.balanceAfter)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className={`flex justify-end ${s.totals}`}>
        <div className={`grid break-inside-avoid ${s.totalsRow}`} dir="ltr">
          <div
            className={`flex items-center justify-center border-[#8a8a8a] font-bold whitespace-nowrap ${s.totalsValue}`}
          >
            {formatAmount(party.balance)}
          </div>
          <div className={`flex items-center justify-end font-bold whitespace-nowrap ${s.totalsLabel}`} dir="rtl">
            {tPrint("currentBalance")}
          </div>
        </div>
      </section>
    </div>
  );
}
