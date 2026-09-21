import { useTranslations } from "next-intl";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { PrintLayoutProps } from "@/types";

export function PrintLayoutA5({ data }: PrintLayoutProps) {
  const t = useTranslations("print");
  const hasProductCodes = data.lines.some((line) => line.productCode);

  return (
    <div className="mx-auto flex min-h-[148mm] w-[210mm] flex-col bg-white p-6 text-black" dir="rtl">
      <header className="flex items-start justify-between border-b border-black pb-2">
        <div className="flex flex-col">
          <span className="text-lg font-bold">{data.shop.name}</span>
          <span className="text-xs">{data.shop.address}</span>
        </div>
        <div className="flex flex-col items-end text-end text-xs">
          <span className="text-base font-bold">{data.documentTypeLabel}</span>
          <span>
            #{String(data.number).padStart(6, "0")} · {formatDate(data.issuedAt)}
            {data.issuedTime ? ` · ${data.issuedTime}` : ""}
          </span>
        </div>
      </header>

      <div className="mt-2 flex flex-col text-xs">
        <span>
          {data.partyLabel}: {data.partyCompanyName ? `${data.partyCompanyName} — ` : ""}
          {data.partyName}
        </span>
        {data.partyAddress && <span>{data.partyAddress}</span>}
      </div>

      <table className="mt-2 w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-black">
            {hasProductCodes && <th className="p-1 text-right">{t("columnCode")}</th>}
            <th className="p-1 text-right">{t("columnProduct")}</th>
            <th className="p-1 text-right">{t("columnQty")}</th>
            <th className="p-1 text-right">{t("columnPrice")}</th>
            <th className="p-1 text-right">{t("columnTotal")}</th>
          </tr>
        </thead>
        <tbody>
          {data.lines.map((line, index) => (
            <tr key={index} className="border-b border-gray-300">
              {hasProductCodes && <td className="p-1">{line.productCode}</td>}
              <td className="p-1">{line.productName}</td>
              <td className="p-1">{formatNumber(line.qty)}</td>
              <td className="p-1">{formatMoney(line.unitPrice)}</td>
              <td className="p-1">{formatMoney(line.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 flex justify-end">
        <div className="flex w-56 flex-col gap-0.5 text-xs">
          <div className="flex justify-between font-bold">
            <span>{t("total")}</span>
            <span>{formatMoney(data.total)}</span>
          </div>
          {data.previousBalance !== undefined && (
            <div className="flex justify-between">
              <span>{t("previousBalance")}</span>
              <span>{formatMoney(data.previousBalance)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>{t("paid")}</span>
            <span>{formatMoney(data.paidAmount)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>{data.currentBalance !== undefined ? t("currentBalance") : t("remaining")}</span>
            <span>{formatMoney(data.currentBalance ?? data.remainingAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
