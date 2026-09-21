import { useTranslations } from "next-intl";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { PrintLayoutProps } from "@/types";

export function PrintLayoutA4({ data }: PrintLayoutProps) {
  const t = useTranslations("print");

  return (
    <div className="mx-auto flex w-[210mm] flex-col bg-white p-12 text-black" dir="rtl">
      <header className="flex items-start justify-between border-b-2 border-black pb-4">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold">{data.shop.name}</span>
          <span className="text-sm">{data.shop.address}</span>
          <span className="text-sm" dir="ltr">
            {data.shop.phone}
          </span>
          {data.shop.taxNote && (
            <span className="text-sm">
              {t("taxNote")}: {data.shop.taxNote}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 text-end">
          <span className="text-xl font-bold">{data.documentTypeLabel}</span>
          <span className="text-sm">
            {t("number")}: #{String(data.number).padStart(6, "0")}
          </span>
          <span className="text-sm">
            {t("date")}: {formatDate(data.issuedAt)}
          </span>
          <span className="text-sm">
            {t("cashier")}: {data.cashierName}
          </span>
        </div>
      </header>

      <section className="mt-4 flex justify-between border-b border-black pb-4 text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">
            {data.partyLabel}: {data.partyName}
          </span>
          {data.partyPhone && <span dir="ltr">{data.partyPhone}</span>}
        </div>
      </section>

      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="p-2 text-right">{t("columnProduct")}</th>
            <th className="p-2 text-right">{t("columnUnit")}</th>
            <th className="p-2 text-right">{t("columnQty")}</th>
            <th className="p-2 text-right">{t("columnPrice")}</th>
            <th className="p-2 text-right">{t("columnTotal")}</th>
          </tr>
        </thead>
        <tbody>
          {data.lines.map((line, index) => (
            <tr key={index} className="border-b border-gray-300">
              <td className="p-2">{line.productName}</td>
              <td className="p-2">{line.unitName}</td>
              <td className="p-2">{formatNumber(line.qty)}</td>
              <td className="p-2">{formatMoney(line.unitPrice)}</td>
              <td className="p-2">{formatMoney(line.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-4 flex justify-end">
        <div className="flex w-64 flex-col gap-1 text-sm">
          <Row label={t("subtotal")} value={formatMoney(data.subtotal)} />
          {Number(data.discountAmount) > 0 && <Row label={t("discount")} value={`-${formatMoney(data.discountAmount)}`} />}
          <Row label={t("total")} value={formatMoney(data.total)} bold />
          <Row label={t("paid")} value={formatMoney(data.paidAmount)} />
          <Row label={t("remaining")} value={formatMoney(data.remainingAmount)} bold />
        </div>
      </section>

      {data.shop.invoiceFooter && (
        <footer className="mt-8 border-t border-black pt-4 text-center text-sm">{data.shop.invoiceFooter}</footer>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "border-t border-black pt-1 font-bold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
