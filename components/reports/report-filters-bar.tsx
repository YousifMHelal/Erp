import { useTranslations } from "next-intl";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import type { ReportFiltersBarProps } from "@/types";

export function ReportFiltersBar({ dateRange, onDateRangeChange }: ReportFiltersBarProps) {
  const t = useTranslations("reports");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangePicker value={dateRange} onChange={onDateRangeChange} placeholder={t("dateRangePlaceholder")} />
    </div>
  );
}
