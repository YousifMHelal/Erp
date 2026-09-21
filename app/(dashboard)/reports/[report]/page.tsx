import { notFound } from "next/navigation";
import { ReportShell } from "@/components/reports/report-shell";
import { ReportChart } from "@/components/reports/report-chart";
import { ReportTable } from "@/components/reports/report-table";
import { getReportDefinition } from "@/components/reports/report-data";
import type { ReportKey } from "@/types";

const VALID_REPORTS: ReportKey[] = [
  "sales",
  "purchases",
  "inventory",
  "customers",
  "suppliers",
  "cashboxes",
  "collections",
  "payments",
  "profit-loss",
];

export default async function ReportPage({ params }: { params: Promise<{ report: string }> }) {
  const { report } = await params;

  if (!VALID_REPORTS.includes(report as ReportKey)) {
    notFound();
  }

  const reportKey = report as ReportKey;
  const definition = getReportDefinition(reportKey);

  return (
    <ReportShell reportKey={reportKey}>
      {definition.chart && <ReportChart title={definition.chart.title} data={definition.chart.data} />}
      <ReportTable columns={definition.columns} rows={definition.rows} footerRow={definition.footerRow} />
    </ReportShell>
  );
}
