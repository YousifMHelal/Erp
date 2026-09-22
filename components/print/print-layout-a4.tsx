import { useTranslations } from "next-intl";
import {
  formatDate,
  formatMoney,
  formatMoneyInWords,
  formatNumber,
} from "@/lib/format";
import { DEFAULT_TOTALS_ROWS, resolveSystemFieldValue } from "@/lib/print-fields";
import type { PrintFieldItem, PrintInvoiceData, PrintLayoutProps, PrintTotalsRowKey } from "@/types";

function resolveFieldValue(item: PrintFieldItem, data: PrintInvoiceData): string | undefined {
  return item.source.kind === "system" ? resolveSystemFieldValue(item.source.fieldKey, data) : item.source.value;
}

function resolveTotalsRowValue(key: PrintTotalsRowKey, data: PrintInvoiceData): string | undefined {
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

export function PrintLayoutA4({ data, infoColumns, totalsRows }: PrintLayoutProps) {
  const t = useTranslations("print");

  return (
    <div
      className="invoice-a4 mx-auto w-[210mm] overflow-hidden bg-white text-black"
      dir="rtl"
      style={{
        fontFamily: "Arial, Tahoma, sans-serif",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {/* =========================================================
          TOP GREY HEADER
      ========================================================== */}
      <header className="mx-[1.5mm] mt-[1.5mm] flex h-[11mm] items-center justify-between bg-[#e5e5e5] px-[6mm]">
        <span className="text-[24px] leading-none font-bold">
          {data.documentTypeLabel}
        </span>

        <span className="text-[20px] leading-none font-bold">
          {data.shop.name}
        </span>
      </header>

      {/* =========================================================
          LOGO + CUSTOMER + INVOICE INFO — 3 columns, RTL order:
          col 1 (right) invoice meta, col 2 (middle) customer, col 3 (left) logo
      ========================================================== */}
      <section
        className="flex h-[36mm] items-start justify-between px-[5mm] pt-[5.5mm]"
        dir="rtl"
      >
        {/* Col 1: invoice meta + staff phones, or the configured field list */}
        <div className="w-[54mm] text-[16px] leading-[1.45]">
          {infoColumns ? (
            <ConfiguredFieldColumn items={infoColumns.col1} data={data} />
          ) : (
            <>
              <InfoRow label={t("number")} value={String(data.number)} />

              <InfoRow label={t("date")} value={formatDate(data.issuedAt)} />

              <div className="mt-[1mm] space-y-[0.5mm]">
                {data.staffContacts?.map((staff, index) => (
                  <div
                    key={index}
                    className="flex items-baseline justify-end text-[15.5px] whitespace-nowrap"
                    dir="rtl"
                  >
                    <span className="font-bold">أ/{staff.name}</span>

                    <span className="mx-[1.2mm]">:</span>

                    <span dir="ltr" className="font-medium">
                      {staff.phone}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Col 2: customer name, phone, address, company name, shop address, or the configured field list */}
        <div className="w-[55mm] text-[16px] leading-[1.5]">
          {infoColumns ? (
            <>
              <div className="mb-[1mm] text-right text-[18px] font-bold">
                {data.partyLabel}
              </div>
              <ConfiguredFieldColumn items={infoColumns.col2} data={data} />
            </>
          ) : (
            <>
              <div className="mb-[1mm] text-right text-[18px] font-bold">
                {data.partyLabel}
              </div>

              <div className="text-right">
                {data.partyCompanyName && (
                  <div className="whitespace-nowrap">
                    أ/ {data.partyCompanyName}
                  </div>
                )}

                <div className="whitespace-nowrap">{data.partyName}</div>

                {data.partyPhone && (
                  <div className="whitespace-nowrap" dir="ltr">
                    {data.partyPhone}
                  </div>
                )}

                {data.partyAddress && (
                  <div className="whitespace-nowrap">{data.partyAddress}</div>
                )}
              </div>

              <div className="mt-[1mm] text-right text-[15.5px] whitespace-nowrap">
                <span className="font-bold">{t("shopAddress")} :</span>{" "}
                <span className="font-medium">{data.shop.address}</span>
              </div>
            </>
          )}
        </div>

        {/* Col 3: logo only */}
        <div
          className="flex h-[29mm] w-[64mm] items-center justify-start"
          dir="ltr"
        >
          {data.shop.logoDataUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={data.shop.logoDataUrl}
              alt={data.shop.name}
              className="max-h-full max-w-full object-contain object-left"
            />
          )}
        </div>
      </section>

      {/* =========================================================
          PRODUCTS TABLE
      ========================================================== */}
      <div className="mx-[1.5mm] w-[207mm]">
        <table
          className="w-[207mm] table-fixed border-collapse text-[16px]"
          dir="rtl"
        >
          {/*
            Widths copied proportionally from reference image:

            row no       7.5mm
            code        23mm
            product     58mm
            unit        28.5mm
            qty         28mm
            price       31mm
            total       31mm
          */}
          <colgroup>
            <col style={{ width: "7.5mm" }} />
            <col style={{ width: "23mm" }} />
            <col style={{ width: "58mm" }} />
            <col style={{ width: "28.5mm" }} />
            <col style={{ width: "28mm" }} />
            <col style={{ width: "31mm" }} />
            <col style={{ width: "31mm" }} />
          </colgroup>

          <thead>
            <tr className="h-[6.7mm]">
              {/* row-number column intentionally has NO border */}
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
              <tr key={index} className="h-[9.2mm]">
                {/* Number is OUTSIDE bordered table */}
                <td className="border-0 px-0 text-center align-middle text-[13px] font-normal text-black">
                  {index + 1}
                </td>

                {/* Product code */}
                <td className="border-[1.2px] border-[#8a8a8a] px-[1.5mm] text-center align-middle text-[16.5px]">
                  {line.productCode ?? ""}
                </td>

                {/* Product name */}
                <td className="border-[1.2px] border-[#8a8a8a] px-[2mm] text-right align-middle text-[17px] leading-none">
                  <div className="whitespace-nowrap">{line.productName}</div>
                </td>

                {/* Unit */}
                <td className="border-[1.2px] border-[#8a8a8a] px-[1mm] text-center align-middle text-[17px]">
                  {line.unitName}
                </td>

                {/* Quantity */}
                <td
                  className="border-[1.2px] border-[#8a8a8a] px-[1mm] text-center align-middle text-[16.5px]"
                  dir="ltr"
                >
                  {formatNumber(line.qty)}
                </td>

                {/* Price */}
                <td
                  className="border-[1.2px] border-[#8a8a8a] px-[1mm] text-center align-middle text-[16.5px]"
                  dir="ltr"
                >
                  {formatMoney(line.unitPrice)}
                </td>

                {/* Total */}
                <td
                  className="border-[1.2px] border-[#8a8a8a] px-[1mm] text-center align-middle text-[16.5px]"
                  dir="ltr"
                >
                  {formatMoney(line.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* =========================================================
          BOTTOM AREA
      ========================================================== */}
      <section className="relative mx-[1.5mm] h-[36mm] w-[207mm]">
        {/* LEFT TOTALS */}
        <div className="absolute top-0 left-0 w-[61mm]" dir="ltr">
          {(() => {
            const rows = totalsRows ?? DEFAULT_TOTALS_ROWS;
            const visibleRows = rows
              .filter((row) => row.visible)
              .map((row) => ({ ...row, value: resolveTotalsRowValue(row.key, data) }))
              .filter((row): row is (typeof rows)[number] & { value: string } => row.value !== undefined);

            return visibleRows.map((row, index) => {
              const defaultLabel = row.key === "remaining" && data.currentBalance !== undefined ? t("currentBalance") : t(row.key);
              return (
                <TotalsRow
                  key={row.key}
                  label={row.label.trim() || defaultLabel}
                  value={row.value}
                  first={index === 0}
                />
              );
            });
          })()}
        </div>

        {/* AMOUNT IN WORDS */}
        <div
          className="absolute top-[9.5mm] right-[10mm] w-[101mm] text-right text-[15px] whitespace-nowrap"
          dir="rtl"
        >
          <span className="font-medium">{t("amountInWords")} :</span>{" "}
          <span className="font-bold font-medium underline decoration-[1px] underline-offset-[2px]">
            {formatMoneyInWords(data.total)}
          </span>
        </div>

        {/* SIGNATURE / EMPTY BOX */}
        <div
          className="absolute right-[15.5mm] bottom-[1mm] flex items-center gap-[1.5mm]"
          dir="rtl"
        >
          <span className="text-[16px] font-medium whitespace-nowrap">
            {t("signatureBox")}:
          </span>

          <div className="h-[9mm] w-[58mm] border-[2px] border-dashed border-black" />
        </div>
      </section>

      {/* Reference image has no footer.
          This will appear only if invoiceFooter exists. */}
      {data.shop.invoiceFooter && (
        <footer className="mx-[1.5mm] mt-2 border-t border-black px-[4mm] py-[2mm] text-center text-[12px]">
          {data.shop.invoiceFooter}
        </footer>
      )}
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex h-[7mm] items-center justify-start gap-[2mm] whitespace-nowrap"
      dir="rtl"
    >
      {label && <span className="font-bold">{label + " :"}</span>}

      <span className="font-medium" dir="ltr">
        {value}
      </span>
    </div>
  );
}

/** Renders a settings-configured field list, skipping any row whose resolved value is empty. */
function ConfiguredFieldColumn({ items, data }: { items: PrintFieldItem[]; data: PrintInvoiceData }) {
  return (
    <div className="space-y-[0.5mm]">
      {items.map((item) => {
        const value = resolveFieldValue(item, data);
        if (!value) return null;
        return <InfoRow key={item.id} label={item.label} value={value} />;
      })}
    </div>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-[1.2px] border-[#8a8a8a] bg-[#f2f2f2] px-[1mm] text-center align-middle text-[14.5px] leading-none font-bold">
      {children}
    </th>
  );
}

function TotalsRow({
  label,
  value,
  first = false,
}: {
  label: string;
  value: string;
  first?: boolean;
}) {
  return (
    <div className="grid h-[9mm] grid-cols-[31mm_30mm]" dir="ltr">
      <div
        className={[
          "flex items-center justify-center",
          "border-x border-b border-[#8a8a8a]",
          "text-[18px] font-bold",
          first ? "border-t" : "",
        ].join(" ")}
      >
        {value}
      </div>

      <div className="flex items-center justify-start px-[1.5mm] text-[18px] font-bold whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}
