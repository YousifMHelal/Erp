import { useTranslations } from "next-intl";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { PrintLayoutProps } from "@/types";

export function PrintLayout80mm({ data }: PrintLayoutProps) {
  const t = useTranslations("print");

  return (
    <div className="mx-auto flex w-[80mm] flex-col gap-2 bg-white p-3 font-mono text-black" dir="rtl" style={{ fontSize: "10pt" }}>
      <header className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-sm font-bold">{data.shop.name}</span>
        <span>{data.shop.address}</span>
        <span dir="ltr">{data.shop.phone}</span>
      </header>

      <Dashes />

      <div className="flex flex-col gap-0.5">
        <div className="flex justify-between">
          <span>{t("number")}</span>
          <span>#{String(data.number).padStart(6, "0")}</span>
        </div>
        <div className="flex justify-between">
          <span>{t("date")}</span>
          <span>{formatDate(data.issuedAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>{data.partyLabel}</span>
          <span>{data.partyName}</span>
        </div>
      </div>

      <Dashes />

      <div className="flex flex-col gap-1">
        {data.lines.map((line, index) => (
          <div key={index} className="flex flex-col">
            <span>{line.productName}</span>
            <div className="flex justify-between">
              <span>
                {formatNumber(line.qty)} × {formatMoney(line.unitPrice)}
              </span>
              <span>{formatMoney(line.lineTotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <Dashes />

      <div className="flex flex-col gap-0.5">
        <div className="flex justify-between font-bold">
          <span>{t("total")}</span>
          <span>{formatMoney(data.total)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t("paid")}</span>
          <span>{formatMoney(data.paidAmount)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>{t("remaining")}</span>
          <span>{formatMoney(data.remainingAmount)}</span>
        </div>
      </div>

      {data.shop.invoiceFooter && (
        <>
          <Dashes />
          <p className="text-center">{data.shop.invoiceFooter}</p>
        </>
      )}
    </div>
  );
}

function Dashes() {
  return <div className="border-t border-dashed border-black" aria-hidden="true" />;
}
