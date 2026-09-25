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
import { ReportChart, ReportPrintChart } from "@/components/reports/report-chart";
import { ReportTable } from "@/components/reports/report-table";
import { ReportPrintHeader } from "@/components/reports/report-print-header";
import { ReportPrintSummary } from "@/components/reports/report-print-summary";
import { ReportPrintTable } from "@/components/reports/report-print-table";
import { reportTitleKey } from "@/components/reports/report-picker";
import { formatAmount, formatDate, formatNumber } from "@/lib/format";
import type { DateRange, ReportFilterOptions, ReportFilters, ReportPrintField, ReportShellProps } from "@/types";

/** Filters whose selected id is echoed by name on the printed header. */
const PRINTED_FILTERS: [key: keyof ReportFilters & `${string}Id`, options: keyof ReportFilterOptions][] = [
  ["customerId", "customers"],
  ["supplierId", "suppliers"],
  ["cashboxId", "cashboxes"],
  ["categoryId", "categories"],
  ["productId", "products"],
  ["userId", "users"],
];

const COUNT_COLUMNS = ["count", "number", "quantity"];
const TEXT_COLUMNS = new Set(["name", "product", "category", "unit", "party", "cashbox"]);

/** A4 with margins on every printed page (the global print CSS uses a margin-less page for the invoice layouts). */
const REPORT_PAGE_CSS = "@media print { @page { size: A4 portrait; margin: 10mm 8mm; } }";

/** `yyyy-MM-dd` → `dd/MM/yyyy`, formatted from the string so no timezone can shift the day. */
function formatDay(day: string): string {
  return day.split("-").reverse().join("/");
}

export function ReportShell({ reportKey, filters, options, report, printShop }: ReportShellProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [printedAt, setPrintedAt] = useState<Date>();
  useEffect(() => {
    const stamp = () => setPrintedAt(new Date());
    stamp();
    window.addEventListener("beforeprint", stamp);
    return () => window.removeEventListener("beforeprint", stamp);
  }, []);
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

  /** Printed documents show plain amounts (no currency suffix), like the invoice layouts. */
  function printValue(key: string, value: string | undefined): string {
    if (!value) return "";
    if (value === "total") return t("reports.totalLabel");
    if (report.moneyColumns.includes(key)) return formatAmount(value);
    if (key === "date") return formatDate(value);
    if (key === "margin") return `${formatNumber(value)}%`;
    if (COUNT_COLUMNS.includes(key)) return formatNumber(value);
    return value;
  }

  const toPrintRow = (row: Record<string, string>) =>
    Object.fromEntries(report.columns.map((key) => [key, printValue(key, row[key])]));
  const printColumns = columns.map(({ key, label }) => ({ key, label, numeric: !TEXT_COLUMNS.has(key) }));
  const printFooterRow = report.footerRow ? toPrintRow(report.footerRow) : undefined;
  const printSummary: ReportPrintField[] = report.footerRow
    ? printColumns.flatMap(({ key, label }) => {
        const raw = report.footerRow?.[key];
        return raw && raw !== "total" ? [{ label, value: printValue(key, raw) }] : [];
      })
    : [];
  const printPeriod = filters.from && filters.to
    ? `${formatDay(filters.from)} – ${formatDay(filters.to)}`
    : filters.from
      ? t("print.statementPeriodFrom", { date: formatDay(filters.from) })
      : filters.to
        ? t("print.statementPeriodTo", { date: formatDay(filters.to) })
        : t("reports.printAllPeriod");
  const printFilters: ReportPrintField[] = PRINTED_FILTERS.flatMap(([key, optionsKey]) => {
    const id = filters[key];
    const selected = id ? options[optionsKey].find((option) => option.value === id) : undefined;
    return selected ? [{ label: t(`reports.printFilters.${key}`), value: selected.label }] : [];
  });
  const title = t(reportTitleKey(reportKey));
  const chartTitle = report.chart ? t(`reports.charts.${report.chart.titleKey}`) : "";

  return (
    <>
      <PageHeader
        title={title}
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
        {report.chart ? <ReportChart title={chartTitle} data={report.chart.data} /> : null}
        {rows.length ? (
          <ReportTable columns={columns} rows={rows} footerRow={footerRow} />
        ) : (
          <EmptyState icon={<FileBarChart className="size-6" />} title={t("reports.empty")} />
        )}
      </div>

      {/* Print/PDF document in the shop's invoice template design; hidden on screen, the only thing printed. */}
      <div
        id="print-root"
        className="report-print invoice-a4 hidden bg-white text-black"
        dir="rtl"
        style={{ fontFamily: "Arial, Tahoma, sans-serif", fontVariantNumeric: "tabular-nums" }}
      >
        <style>{REPORT_PAGE_CSS}</style>
        <ReportPrintHeader
          title={title}
          shop={printShop}
          period={printPeriod}
          printedAt={printedAt}
          activeFilters={printFilters}
        />
        <div className="flex flex-col gap-[4mm]">
          <ReportPrintSummary items={printSummary} />
          {report.chart ? <ReportPrintChart title={chartTitle} data={report.chart.data} /> : null}
          {rows.length ? (
            <ReportPrintTable columns={printColumns} rows={report.rows.map(toPrintRow)} footerRow={printFooterRow} />
          ) : (
            <p className="py-[8mm] text-center text-[14px]">{t("reports.empty")}</p>
          )}
        </div>
      </div>
    </>
  );
}
