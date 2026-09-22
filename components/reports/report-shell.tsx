"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileBarChart } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Money } from "@/components/shared/money";
import { EmptyState } from "@/components/shared/empty-state";
import { ReportFiltersBar } from "@/components/reports/report-filters-bar";
import { ExportButtons } from "@/components/reports/export-buttons";
import { ReportChart } from "@/components/reports/report-chart";
import { ReportTable } from "@/components/reports/report-table";
import { reportTitleKey } from "@/components/reports/report-picker";
import { formatDate, formatNumber } from "@/lib/format";
import type { DateRange, ReportFilters, ReportShellProps } from "@/types";

export function ReportShell({ reportKey, filters, options, report }: ReportShellProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const dateRange = {
    from: filters.from ? new Date(`${filters.from}T00:00:00`) : undefined,
    to: filters.to ? new Date(`${filters.to}T00:00:00`) : undefined,
  };

  function updateFilters(changes: Partial<ReportFilters>) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, ...changes })) {
      if (value) params.set(key, value);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function changeDateRange(range: DateRange) {
    updateFilters({
      from: range.from ? format(range.from, "yyyy-MM-dd") : undefined,
      to: range.to ? format(range.to, "yyyy-MM-dd") : undefined,
    });
  }

  function renderValue(key: string, value: string | undefined) {
    if (!value) return "—";
    if (value === "total") return t("reports.totalLabel");
    if (report.moneyColumns.includes(key)) return <Money value={value} />;
    if (key === "date") return formatDate(value);
    if (key === "margin") return `${formatNumber(value)}%`;
    if (["count", "number", "quantity"].includes(key)) return <span className="tabular-nums">{formatNumber(value)}</span>;
    return value;
  }

  const columns = report.columns.map((key) => ({
    key,
    label: t(`reports.columns.${key}`),
    align: report.moneyColumns.includes(key) ? "end" as const : undefined,
  }));
  const rows = report.rows.map((row) => Object.fromEntries(
    report.columns.map((key) => [key, renderValue(key, row[key])]),
  ));
  const footerRow = report.footerRow ? Object.fromEntries(
    report.columns.map((key) => [key, renderValue(key, report.footerRow?.[key])]),
  ) : undefined;

  return (
    <>
      <PageHeader
        title={t(reportTitleKey(reportKey))}
        breadcrumbs={[{ labelKey: "nav.reports", href: "/reports" }, { labelKey: reportTitleKey(reportKey) }]}
        actions={<ExportButtons reportKey={reportKey} filters={filters} />}
      />
      <div className="flex flex-col gap-4">
        <ReportFiltersBar
          reportKey={reportKey}
          filters={filters}
          options={options}
          dateRange={dateRange}
          onDateRangeChange={changeDateRange}
          onFilterChange={(key, value) => updateFilters({ [key]: value })}
        />
        {report.chart ? <ReportChart title={t(`reports.charts.${report.chart.titleKey}`)} data={report.chart.data} /> : null}
        {rows.length ? (
          <ReportTable columns={columns} rows={rows} footerRow={footerRow} />
        ) : (
          <EmptyState icon={<FileBarChart className="size-6" />} title={t("reports.empty")} />
        )}
      </div>
    </>
  );
}
