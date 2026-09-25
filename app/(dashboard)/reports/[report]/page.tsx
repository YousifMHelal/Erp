import { ShieldAlert } from "lucide-react";
import { notFound } from "next/navigation";
import { getReportData, getReportFoundation } from "@/actions/reports.actions";
import { EmptyState } from "@/components/shared/empty-state";
import { ReportShell } from "@/components/reports/report-shell";
import { loadReportPrintShop } from "@/lib/report-print";
import messages from "@/messages/ar.json";
import type { ReportFilters, ReportKey } from "@/types";

const VALID_REPORTS = new Set<ReportKey>([
  "sales", "purchases", "inventory", "customers", "suppliers",
  "cashboxes", "collections", "payments", "profit-loss",
]);

export default async function ReportPage({ params, searchParams }: {
  params: Promise<{ report: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ report }, query] = await Promise.all([params, searchParams]);
  if (!VALID_REPORTS.has(report as ReportKey)) notFound();
  const reportKey = report as ReportKey;
  const filters: ReportFilters = Object.fromEntries(
    Object.entries(query).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
  const input = { reportKey, ...filters };
  const [foundation, dataset, printShop] = await Promise.all([
    getReportFoundation(input),
    getReportData(input),
    loadReportPrintShop(),
  ]);
  if (!foundation.success || !dataset.success) {
    const error = !foundation.success ? foundation.error : !dataset.success ? dataset.error : messages.reportAction.failed;
    return <EmptyState icon={<ShieldAlert className="size-6" />} title={error} />;
  }
  return <ReportShell reportKey={reportKey} filters={foundation.data.filters} options={foundation.data.options} report={dataset.data} printShop={printShop} />;
}
