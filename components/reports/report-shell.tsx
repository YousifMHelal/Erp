"use client";

import { useEffect, useState, useTransition } from "react";
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
import { formatDate, formatNumber, formatTime } from "@/lib/format";
import type { DateRange, ReportFilters, ReportShellProps } from "@/types";

export function ReportShell({ reportKey, filters, options, report }: ReportShellProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [generatedAt, setGeneratedAt] = useState<Date>();
  useEffect(() => setGeneratedAt(new Date()), []);
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
        <div className="print:hidden">
          <ReportFiltersBar
            reportKey={reportKey}
            filters={filters}
            options={options}
            dateRange={dateRange}
            onDateRangeChange={changeDateRange}
            onFilterChange={(key, value) => updateFilters({ [key]: value })}
          />
        </div>
        <div id="print-root" className="report-print flex flex-col gap-4">
          <div className="hidden print:flex print:flex-col print:gap-1 print:border-b print:border-black print:pb-3">
            <div className="flex items-center justify-between">
              <h1 className="text-title-2 font-semibold">{t(reportTitleKey(reportKey))}</h1>
              <span className="text-body-sm">{t("app.name")}</span>
            </div>
            <div className="flex items-center justify-between text-body-sm text-muted-foreground">
              <span>
                {t("reports.printDateRange", {
                  range:
                    dateRange.from && dateRange.to
                      ? `${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`
                      : t("reports.printAllPeriod"),
                })}
              </span>
              {generatedAt ? (
                <span>{t("reports.printGeneratedAt", { date: `${formatDate(generatedAt)} ${formatTime(generatedAt)}` })}</span>
              ) : null}
            </div>
          </div>
          {report.chart ? <ReportChart title={t(`reports.charts.${report.chart.titleKey}`)} data={report.chart.data} /> : null}
          {rows.length ? (
            <ReportTable columns={columns} rows={rows} footerRow={footerRow} />
          ) : (
            <EmptyState icon={<FileBarChart className="size-6" />} title={t("reports.empty")} />
          )}
        </div>
      </div>
    </>
  );
}
