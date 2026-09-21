"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { ReportFiltersBar } from "@/components/reports/report-filters-bar";
import { ExportButtons } from "@/components/reports/export-buttons";
import { reportTitleKey } from "@/components/reports/report-picker";
import type { DateRange, ReportShellProps } from "@/types";

export function ReportShell({ reportKey, children }: ReportShellProps) {
  const t = useTranslations();
  const [dateRange, setDateRange] = useState<DateRange>({});

  return (
    <>
      <PageHeader
        title={t(reportTitleKey(reportKey))}
        breadcrumbs={[{ labelKey: "nav.reports", href: "/reports" }, { labelKey: reportTitleKey(reportKey) }]}
        actions={<ExportButtons />}
      />
      <div className="flex flex-col gap-4">
        <ReportFiltersBar dateRange={dateRange} onDateRangeChange={setDateRange} />
        {children}
      </div>
    </>
  );
}
