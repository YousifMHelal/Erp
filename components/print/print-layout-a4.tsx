import { useTranslations } from "next-intl";
import { formatDate, formatMoney, formatMoneyInWords, formatNumber } from "@/lib/format";
import type { PrintLayoutProps } from "@/types";

export function PrintLayoutA4({ data }: PrintLayoutProps) {
  const t = useTranslations("print");
  const hasProductCodes = data.lines.some((line) => line.productCode);

  return (
    <div className="mx-auto flex w-[210mm] flex-col bg-white text-black" dir="rtl">
      <header className="flex items-center justify-between gap-4 bg-neutral-100 px-8 py-5">
        <span className="text-3xl font-bold">{data.documentTypeLabel}</span>
        <span className="text-2xl font-bold">{data.shop.name}</span>
      </header>

      <section className="flex items-start justify-between gap-6 px-8 pt-5 pb-3 text-base">
        <div className="flex flex-col gap-1">
          <span className="font-bold">{data.partyLabel}</span>
          {data.partyCompanyName && <span>أ/ {data.partyCompanyName}</span>}
          <span>{data.partyName}</span>
          {data.partyAddress && <span>{data.partyAddress}</span>}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 text-end">
          <div className="flex items-baseline gap-2">
            <span className="font-medium">{data.number}</span>
            <span>{t("number")}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-medium">{formatDate(data.issuedAt)}</span>
            <span>{t("date")}</span>
          </div>
          {data.issuedTime && (
            <div className="flex items-baseline gap-2">
              <span className="font-medium">{data.issuedTime}</span>
              <span>{t("time")}</span>
            </div>
          )}
          {data.staffContacts?.map((staff, index) => (
            <div key={index} className="flex items-baseline gap-2">
              <span className="font-bold">أ/{staff.name}</span>
              <span dir="ltr" className="font-medium">
                : {staff.phone}
              </span>
            </div>
          ))}
        </div>
      </section>

      {data.shop.logoDataUrl && (
        <div className="px-8 pb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.shop.logoDataUrl} alt={data.shop.name} className="h-16 w-auto object-contain" />
        </div>
      )}

      <p className="border-t border-black px-8 py-2 text-base">
        {t("shopAddress")}: {data.shop.address}
      </p>

      <table className="w-full border-collapse text-base">
        <colgroup>
          <col className="w-10" />
        </colgroup>
        <thead>
          <tr className="border-y-2 border-black bg-neutral-100">
            <th className="px-2 py-2 font-normal" />
            {hasProductCodes && <th className="border-x border-black px-3 py-2 font-bold">{t("columnCode")}</th>}
            <th className="border-e border-black px-3 py-2 font-bold">{t("columnProduct")}</th>
            <th className="border-e border-black px-3 py-2 font-bold">{t("columnUnit")}</th>
            <th className="border-e border-black px-3 py-2 font-bold">{t("columnQty")}</th>
            <th className="border-e border-black px-3 py-2 font-bold">{t("columnPrice")}</th>
            <th className="border-s border-black px-3 py-2 font-bold">{t("columnTotal")}</th>
          </tr>
        </thead>
        <tbody>
          {data.lines.map((line, index) => (
            <tr key={index} className="border-b border-black">
              <td className="px-2 py-2.5 text-center text-sm text-neutral-500">{index + 1}</td>
              {hasProductCodes && (
                <td className="border-x border-black px-3 py-2.5 text-center">{line.productCode}</td>
              )}
              <td className="border-e border-black px-3 py-2.5">{line.productName}</td>
              <td className="border-e border-black px-3 py-2.5 text-center">{line.unitName}</td>
              <td className="border-e border-black px-3 py-2.5 text-center">{formatNumber(line.qty)}</td>
              <td className="border-e border-black px-3 py-2.5 text-center">{formatMoney(line.unitPrice)}</td>
              <td className="border-s border-black px-3 py-2.5 text-center">{formatMoney(line.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-start justify-between gap-6 px-8 py-5 text-lg font-bold">
        <div className="flex flex-col items-start gap-4 text-base font-normal">
          <p>
            <span>{t("amountInWords")}</span>
            {" : "}
            <span className="underline">{formatMoneyInWords(data.total)}</span>
          </p>
          <div className="flex w-44 items-center justify-center rounded border-2 border-dashed border-black py-6 text-sm text-neutral-500">
            {t("signatureBox")}
          </div>
        </div>

        <div className="flex flex-col">
          <TotalsRow label={t("total")} value={formatMoney(data.total)} />
          {Number(data.discountAmount) > 0 && (
            <TotalsRow label={t("discount")} value={`-${formatMoney(data.discountAmount)}`} />
          )}
          {data.previousBalance !== undefined && (
            <TotalsRow label={t("previousBalance")} value={formatMoney(data.previousBalance)} />
          )}
          <TotalsRow label={t("paid")} value={formatMoney(data.paidAmount)} />
          <TotalsRow
            label={data.currentBalance !== undefined ? t("currentBalance") : t("remaining")}
            value={formatMoney(data.currentBalance ?? data.remainingAmount)}
          />
        </div>
      </div>

      {data.shop.invoiceFooter && (
        <footer className="border-t border-black px-8 py-3 text-center text-sm">{data.shop.invoiceFooter}</footer>
      )}
    </div>
  );
}

function TotalsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-1">
      <span>{value}</span>
      <span>{label}</span>
    </div>
  );
}
