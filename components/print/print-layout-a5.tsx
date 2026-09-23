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

export function PrintLayoutA5({ data, totalsRows }: PrintLayoutProps) {
  const t = useTranslations("print");

  return (
    <div
      className="invoice-a4 mx-auto w-[148mm] overflow-hidden bg-white text-black"
      dir="rtl"
      style={{
        fontFamily: "Arial, Tahoma, sans-serif",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {/* TOP GREY HEADER */}
      <header className="mx-[1mm] mt-[1mm] flex h-[8mm] items-center justify-between bg-[#e5e5e5] px-[4mm]">
        <span className="text-[17px] leading-none font-bold">{data.documentTypeLabel}</span>
        <span className="text-[14px] leading-none font-bold">{data.shop.name}</span>
      </header>

      {/* LOGO + CUSTOMER + INVOICE INFO */}
      <section className="flex h-[26mm] items-start justify-between px-[3.5mm] pt-[3.5mm]" dir="rtl">
        <div className="w-[42mm] text-[11px] leading-[1.4]">
          <InfoRow label={t("number")} value={String(data.number)} />
          <InfoRow label={t("date")} value={formatDate(data.issuedAt)} />
          <div className="mt-[1mm] space-y-[0.5mm]">
            {data.staffContacts?.map((staff, index) => (
              <div key={index} className="flex items-baseline justify-end text-[10.5px] whitespace-nowrap" dir="rtl">
                <span className="font-bold">{t("staffPrefix")}{staff.name}</span>
                <span className="mx-[1mm]">:</span>
                <span dir="ltr" className="font-medium">{staff.phone}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-[42mm] text-[11px] leading-[1.45]">
          <div className="mb-[1mm] text-right text-[12.5px] font-bold">{data.partyLabel}</div>
          <div className="text-right">
            {data.partyCompanyName && <div className="whitespace-nowrap">{t("staffPrefix")} {data.partyCompanyName}</div>}
            <div className="whitespace-nowrap">{data.partyName}</div>
            {data.partyPhone && <div className="whitespace-nowrap" dir="ltr">{data.partyPhone}</div>}
            {data.partyAddress && <div className="whitespace-nowrap">{data.partyAddress}</div>}
          </div>
          <div className="mt-[1mm] text-right text-[10.5px] whitespace-nowrap">
            <span className="font-bold">{t("shopAddress")} :</span> <span className="font-medium">{data.shop.address}</span>
          </div>
        </div>

        <div className="flex h-[20mm] w-[42mm] items-center justify-start" dir="ltr">
          {data.shop.logoDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.shop.logoDataUrl} alt={data.shop.name} className="max-h-full max-w-full object-contain object-left" />
          )}
        </div>
      </section>

      {/* PRODUCTS TABLE */}
      <div className="mx-[1mm] w-[146mm]">
        <table className="w-[146mm] table-fixed border-collapse text-[11px]" dir="rtl">
          <colgroup>
            <col style={{ width: "6mm" }} />
            <col style={{ width: "16mm" }} />
            <col style={{ width: "40mm" }} />
            <col style={{ width: "20mm" }} />
            <col style={{ width: "20mm" }} />
            <col style={{ width: "22mm" }} />
            <col style={{ width: "22mm" }} />
          </colgroup>
          <thead>
            <tr className="h-[5.5mm]">
              <th className="border-0 bg-white p-0" />
              <TableHeader>{t("columnCode")}</TableHeader>
              <TableHeader>{t("columnProduct")}</TableHeader>
              <TableHeader>{t("columnUnit")}</TableHeader>
              <TableHeader>{t("columnQty")}</TableHeader>
              <TableHeader>{t("columnPrice")}</TableHeader>
              <TableHeader>{t("columnTotal")}</TableHeader>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line, index) => (
              <tr key={index} className="h-[6.8mm]">
                <td className="border-0 px-0 text-center align-middle text-[9px] font-normal text-black">{index + 1}</td>
                <td className="border-[1px] border-[#8a8a8a] px-[1mm] text-center align-middle text-[11px]">{line.productCode ?? ""}</td>
                <td className="border-[1px] border-[#8a8a8a] px-[1.5mm] text-right align-middle text-[11.5px] leading-none">
                  <div className="whitespace-nowrap">{line.productName}</div>
                </td>
                <td className="border-[1px] border-[#8a8a8a] px-[1mm] text-center align-middle text-[11px]">{line.unitName}</td>
                <td className="border-[1px] border-[#8a8a8a] px-[1mm] text-center align-middle text-[11px]" dir="ltr">{formatNumber(line.qty)}</td>
                <td className="border-[1px] border-[#8a8a8a] px-[1mm] text-center align-middle text-[11px]" dir="ltr">{formatMoney(line.unitPrice)}</td>
                <td className="border-[1px] border-[#8a8a8a] px-[1mm] text-center align-middle text-[11px]" dir="ltr">{formatMoney(line.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BOTTOM AREA */}
      <section className="relative mx-[1mm] h-[26mm] w-[146mm]">
        <div className="absolute top-0 left-0 w-[44mm]" dir="ltr">
          {(() => {
            const rows = totalsRows ?? DEFAULT_TOTALS_ROWS;
            const visibleRows = rows
              .filter((row) => row.visible)
              .map((row) => ({ ...row, value: resolveTotalsRowValue(row.key, data) }))
              .filter((row): row is (typeof rows)[number] & { value: string } => row.value !== undefined);

            return visibleRows.map((row, index) => {
              const defaultLabel = row.key === "remaining" && data.currentBalance !== undefined ? t("currentBalance") : t(row.key);
              return <TotalsRow key={row.key} label={row.label.trim() || defaultLabel} value={row.value} first={index === 0} />;
            });
          })()}
        </div>

        <div className="absolute top-[6.5mm] right-[7mm] w-[72mm] text-right text-[10px] whitespace-nowrap" dir="rtl">
          <span className="font-medium">{t("amountInWords")} :</span>{" "}
          <span className="font-bold underline decoration-[1px] underline-offset-[2px]">{formatMoneyInWords(data.total)}</span>
        </div>

        <div className="absolute right-[11mm] bottom-[1mm] flex items-center gap-[1mm]" dir="rtl">
          <span className="text-[11px] font-medium whitespace-nowrap">{t("signatureBox")}:</span>
          <div className="h-[6.5mm] w-[40mm] border-[1.5px] border-dashed border-black" />
        </div>
      </section>

      {data.shop.invoiceFooter && (
        <footer className="mx-[1mm] mt-2 border-t border-black px-[3mm] py-[1.5mm] text-center text-[9px]">
          {data.shop.invoiceFooter}
        </footer>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-[5mm] items-center justify-start gap-[1.5mm] whitespace-nowrap" dir="rtl">
      {label && <span className="font-bold">{label + " :"}</span>}
      <span className="font-medium" dir="ltr">{value}</span>
    </div>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-[1px] border-[#8a8a8a] bg-[#f2f2f2] px-[1mm] text-center align-middle text-[10px] leading-none font-bold">
      {children}
    </th>
  );
}

function TotalsRow({ label, value, first = false }: { label: string; value: string; first?: boolean }) {
  return (
    <div className="grid h-[6mm] grid-cols-[22mm_22mm]" dir="ltr">
      <div
        className={[
          "flex items-center justify-center",
          "border-x border-b border-[#8a8a8a]",
          "text-[12px] font-bold",
          first ? "border-t" : "",
        ].join(" ")}
      >
        {value}
      </div>
      <div className="flex items-center justify-start px-[1mm] text-[12px] font-bold whitespace-nowrap">{label}</div>
    </div>
  );
}
