import { useTranslations } from "next-intl";
import { formatDate, formatShopTime } from "@/lib/format";
import type { ReportPrintField, ReportPrintHeaderProps } from "@/types";

/** Same look as the invoice layouts' InfoRow: bold "label :" then the value. */
function InfoRow({ label, value }: ReportPrintField) {
  return (
    <div className="flex items-baseline gap-[1.5mm] leading-[1.5]">
      {label && <span className="shrink-0 font-bold whitespace-nowrap">{label + " :"}</span>}
      <span className="font-medium">{value}</span>
    </div>
  );
}

/** Print-only report header in the shop's invoice design: grey title bar, info fields, logo. */
export function ReportPrintHeader({ title, shop, period, printedAt, activeFilters }: ReportPrintHeaderProps) {
  const t = useTranslations("reports");

  return (
    <>
      <header className="flex h-[11mm] items-center justify-between bg-[#e5e5e5] px-[6mm]">
        <span className="text-[22px] leading-none font-bold">{title}</span>
        <span className="text-[18px] leading-none font-bold">{shop.name}</span>
      </header>

      {/* RTL order, like the invoice: col 1 (right) report meta, col 2 (middle) filters + shop fields, col 3 (left) logo */}
      <section className="flex items-start justify-between gap-[4mm] px-[3mm] pt-[3mm] pb-[3mm] text-[14px]">
        <div className="w-[62mm] shrink-0">
          <InfoRow label={t("printPeriodLabel")} value={period} />
          {printedAt ? (
            <>
              <InfoRow label={t("printDateLabel")} value={formatDate(printedAt)} />
              <InfoRow label={t("printTimeLabel")} value={formatShopTime(printedAt)} />
            </>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          {activeFilters.map((field) => (
            <InfoRow key={field.label} {...field} />
          ))}
          {shop.fields.map((field, index) => (
            <InfoRow key={index} {...field} />
          ))}
        </div>

        <div className="flex h-[22mm] w-[45mm] shrink-0 items-center justify-start" dir="ltr">
          {shop.logoDataUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={shop.logoDataUrl} alt={shop.name} className="max-h-full max-w-full object-contain object-left" />
          )}
        </div>
      </section>
    </>
  );
}
