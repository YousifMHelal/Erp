import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { KpiRow } from "@/components/dashboard/kpi-row";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { LowStockPanel } from "@/components/dashboard/low-stock-panel";
import { TopDebtorsPanel } from "@/components/dashboard/top-debtors-panel";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { EmptyState } from "@/components/shared/empty-state";
import { getDashboardOverview } from "@/actions/dashboard.actions";

export default async function DashboardPage() {
  const [t, overview] = await Promise.all([getTranslations("dashboard"), getDashboardOverview()]);

  if (!overview.success) {
    return (
      <>
        <PageHeader title={t("title")} description={t("subtitle")} />
        <EmptyState title={overview.error} />
      </>
    );
  }

  const data = overview.data;

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <div className="flex flex-col gap-6">
        <KpiRow
          todaySales={data.todaySales}
          todaySalesDelta={data.todaySalesDelta}
          todayPurchases={data.todayPurchases}
          todayPurchasesDelta={data.todayPurchasesDelta}
          invoiceCount={data.invoiceCount}
          invoiceCountDelta={data.invoiceCountDelta}
          totalReceivables={data.totalReceivables}
        />
        <QuickActions />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SalesTrendChart data={data.salesTrend} />
          </div>
          <LowStockPanel items={data.lowStock} />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopDebtorsPanel items={data.topDebtors} />
          <RecentInvoices items={data.recentInvoices} />
        </div>
      </div>
    </>
  );
}
