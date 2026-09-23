import { useTranslations } from "next-intl";
import { formatDate, formatMoney, formatMoneyInWords, formatNumber } from "@/lib/format";
import { DEFAULT_TOTALS_ROWS } from "@/lib/print-fields";
import type { PrintLayoutProps, PrintTotalsRowKey } from "@/types";

function resolveTotalsRowValue(key: PrintTotalsRowKey, data: PrintLayoutProps["data"]): string | undefined {
  switch (key) {
    case "total":
      return formatMoney(data.total);
    case "discount":
      return Number(data.discountAmount) > 0 ? `-${formatMoney(data.discountAmount)}` : undefined;
    case "previousBalance":
      return data.previousBalance !== undefined ? formatMoney(data.previousBalance) : undefined;
    case "paid":
      return formatMoney(data.paidAmount);
    case "remaining":
      return formatMoney(data.currentBalance ?? data.remainingAmount);
    default:
      return undefined;
  }
}

export function PrintLayout80mm({ data, totalsRows }: PrintLayoutProps) {
  const t = useTranslations("print");
  const hasProductCodes = data.lines.some((line) => line.productCode);

  const rows = totalsRows ?? DEFAULT_TOTALS_ROWS;
  const visibleRows = rows
    .filter((row) => row.visible)
    .map((row) => ({ ...row, value: resolveTotalsRowValue(row.key, data) }))
    .filter((row): row is (typeof rows)[number] & { value: string } => row.value !== undefined);

  return (
    <div
      className="invoice-a4 mx-auto w-[80mm] overflow-hidden bg-white text-black"
      dir="rtl"
      style={{
        fontFamily: "Arial, Tahoma, sans-serif",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {/* TOP GREY HEADER */}
      <header className="mx-[1mm] mt-[1mm] flex h-[8mm] flex-col items-center justify-center gap-[0.5mm] bg-[#e5e5e5] px-[2mm] text-center">
        <span className="text-[13px] leading-none font-bold">{data.shop.name}</span>
        <span className="text-[10px] leading-none font-bold">{data.documentTypeLabel}</span>
      </header>

      {/* SHOP + INVOICE INFO */}
      <section className="flex flex-col gap-[0.5mm] px-[3mm] pt-[2mm] text-[10.5px] leading-[1.5]" dir="rtl">
        <div className="text-center whitespace-nowrap">{data.shop.address}</div>
        {(data.shop.phone || data.shop.phone2) && (
          <div className="text-center whitespace-nowrap" dir="ltr">
            {data.shop.phone}
            {data.shop.phone2 ? ` / ${data.shop.phone2}` : ""}
          </div>
        )}

        <div className="mt-[1mm] border-t border-dashed border-black pt-[1mm]">
          <InfoRow label={t("number")} value={String(data.number)} />
          <InfoRow label={t("date")} value={formatDate(data.issuedAt)} />
          <InfoRow label={data.partyLabel} value={data.partyName} />
        </div>
      </section>

      {/* PRODUCTS TABLE */}
      <div className="mx-[1mm] mt-[1.5mm] w-[78mm]">
        <table className="w-[78mm] table-fixed border-collapse text-[10px]" dir="rtl">
          <colgroup>
            {hasProductCodes && <col style={{ width: "12mm" }} />}
            <col style={{ width: hasProductCodes ? "24mm" : "32mm" }} />
            <col style={{ width: "10mm" }} />
            <col style={{ width: "16mm" }} />
            <col style={{ width: "16mm" }} />
          </colgroup>
          <thead>
            <tr className="h-[5mm]">
              {hasProductCodes && <TableHeader>{t("columnCode")}</TableHeader>}
              <TableHeader>{t("columnProduct")}</TableHeader>
              <TableHeader>{t("columnQty")}</TableHeader>
              <TableHeader>{t("columnPrice")}</TableHeader>
              <TableHeader>{t("columnTotal")}</TableHeader>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line, index) => (
              <tr key={index} className="h-[6mm]">
                {hasProductCodes && (
                  <td className="border-[1px] border-[#8a8a8a] px-[0.5mm] text-center align-middle text-[9.5px]">{line.productCode}</td>
                )}
                <td className="border-[1px] border-[#8a8a8a] px-[1mm] text-right align-middle text-[10px] leading-tight">{line.productName}</td>
                <td className="border-[1px] border-[#8a8a8a] px-[0.5mm] text-center align-middle text-[9.5px]" dir="ltr">{formatNumber(line.qty)}</td>
                <td className="border-[1px] border-[#8a8a8a] px-[0.5mm] text-center align-middle text-[9.5px]" dir="ltr">{formatMoney(line.unitPrice)}</td>
                <td className="border-[1px] border-[#8a8a8a] px-[0.5mm] text-center align-middle text-[9.5px]" dir="ltr">{formatMoney(line.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTALS BOX */}
      <div className="mx-[1mm] mt-[1.5mm] w-[78mm]" dir="ltr">
        {visibleRows.map((row, index) => {
          const defaultLabel = row.key === "remaining" && data.currentBalance !== undefined ? t("currentBalance") : t(row.key);
          return <TotalsRow key={row.key} label={row.label.trim() || defaultLabel} value={row.value} first={index === 0} />;
        })}
      </div>

      {/* AMOUNT IN WORDS */}
      <div className="px-[3mm] pt-[2mm] text-center text-[9.5px]" dir="rtl">
        <div className="font-medium">{t("amountInWords")} :</div>
        <div className="font-bold underline decoration-[1px] underline-offset-[2px]">{formatMoneyInWords(data.total)}</div>
      </div>

      {/* SIGNATURE */}
      <div className="flex flex-col items-center gap-[1mm] px-[3mm] pt-[3mm] pb-[2mm]" dir="rtl">
        <span className="text-[9.5px] font-medium whitespace-nowrap">{t("signatureBox")}:</span>
        <div className="h-[7mm] w-[60mm] border-[1.5px] border-dashed border-black" />
      </div>

      {data.shop.invoiceFooter && (
        <footer className="mx-[1mm] mb-[2mm] border-t border-dashed border-black px-[2mm] pt-[1.5mm] text-center text-[9px]">
          {data.shop.invoiceFooter}
        </footer>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-[2mm] whitespace-nowrap">
      <span className="font-bold">{label}</span>
      <span className="font-medium" dir="ltr">{value}</span>
    </div>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-[1px] border-[#8a8a8a] bg-[#f2f2f2] px-[0.5mm] text-center align-middle text-[9px] leading-none font-bold">
      {children}
    </th>
  );
}

function TotalsRow({ label, value, first = false }: { label: string; value: string; first?: boolean }) {
  return (
    <div className="grid h-[5.5mm] grid-cols-[24mm_1fr]" dir="ltr">
      <div
        className={[
          "flex items-center justify-center",
          "border-x border-b border-[#8a8a8a]",
          "text-[11px] font-bold",
          first ? "border-t" : "",
        ].join(" ")}
      >
        {value}
      </div>
      <div className="flex items-center justify-start px-[1.5mm] text-[11px] font-bold whitespace-nowrap">{label}</div>
    </div>
  );
}
