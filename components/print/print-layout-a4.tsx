import { useTranslations } from "next-intl";
import {
  formatDate,
  formatMoney,
  formatMoneyInWords,
  formatNumber,
} from "@/lib/format";
import type { PrintLayoutProps } from "@/types";

export function PrintLayoutA4({ data }: PrintLayoutProps) {
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
          LOGO + CUSTOMER + INVOICE INFO
      ========================================================== */}
      <section className="relative h-[40.5mm]">
        {/* Logo */}
        {data.shop.logoDataUrl && (
          <div
            className="absolute top-[4mm] left-[3mm] flex h-[29mm] w-[64mm] items-center justify-start"
            dir="ltr"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.shop.logoDataUrl}
              alt={data.shop.name}
              className="max-h-full max-w-full object-contain object-left"
            />
          </div>
        )}

        {/* Customer */}
        <div className="absolute top-[5.5mm] left-[67mm] w-[55mm] text-[16px] leading-[1.5]">
          <div className="mb-[1mm] text-center text-[18px] font-bold">
            {data.partyLabel}
          </div>

          <div className="text-right">
            {data.partyCompanyName && (
              <div className="whitespace-nowrap">
                أ/ {data.partyCompanyName}
              </div>
            )}

            <div className="whitespace-nowrap">{data.partyName}</div>

            {data.partyAddress && (
              <div className="whitespace-nowrap">{data.partyAddress}</div>
            )}
          </div>
        </div>

        {/* Invoice meta */}
        <div className="absolute top-[5.5mm] right-[5mm] w-[54mm] text-[16px] leading-[1.45]">
          <InfoRow label={t("number")} value={String(data.number)} />

          <InfoRow label={t("date")} value={formatDate(data.issuedAt)} />

          {data.issuedTime && (
            <InfoRow label={t("time")} value={data.issuedTime} />
          )}

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
        </div>

        {/* Shop address */}
        <div className="absolute bottom-[1.3mm] left-[57mm] w-[69mm] text-right text-[15.5px] whitespace-nowrap">
          <span className="font-bold">{t("shopAddress")} :</span>{" "}
          <span className="font-medium">{data.shop.address}</span>
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
          <TotalsRow label={t("total")} value={formatMoney(data.total)} first />

          {Number(data.discountAmount) > 0 && (
            <TotalsRow
              label={t("discount")}
              value={`-${formatMoney(data.discountAmount)}`}
            />
          )}

          {data.previousBalance !== undefined && (
            <TotalsRow
              label={t("previousBalance")}
              value={formatMoney(data.previousBalance)}
            />
          )}

          <TotalsRow label={t("paid")} value={formatMoney(data.paidAmount)} />

          <TotalsRow
            label={
              data.currentBalance !== undefined
                ? t("currentBalance")
                : t("remaining")
            }
            value={formatMoney(data.currentBalance ?? data.remainingAmount)}
          />
        </div>

        {/* AMOUNT IN WORDS */}
        <div
          className="absolute top-[9.5mm] right-[10mm] w-[101mm] text-right text-[15px] whitespace-nowrap"
          dir="rtl"
        >
          <span className="font-medium">{t("amountInWords")} :</span>{" "}
          <span className="font-medium underline decoration-[1px] underline-offset-[2px]">
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
        <footer className="mx-[1.5mm] border-t border-black px-[4mm] py-[2mm] text-center text-[12px]">
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
      className="flex h-[7mm] items-center justify-between whitespace-nowrap"
      dir="rtl"
    >
      <span className="font-bold">{label}</span>

      <span className="font-medium" dir="ltr">
        {value}
      </span>
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

      <div
        dir="rtl"
        className="flex items-center px-[1.5mm] text-right text-[18px] font-bold whitespace-nowrap"
      >
        {label}
      </div>
    </div>
  );
}
