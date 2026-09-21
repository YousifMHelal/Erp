import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { KpiRow } from "@/components/dashboard/kpi-row";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { LowStockPanel } from "@/components/dashboard/low-stock-panel";
import { TopDebtorsPanel } from "@/components/dashboard/top-debtors-panel";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import type {
  LowStockItem,
  RecentInvoiceItem,
  SalesTrendPoint,
  TopDebtorItem,
} from "@/types";

const SALES_TREND: SalesTrendPoint[] = [
  { date: "2026-09-15", total: 12400 },
  { date: "2026-09-16", total: 15800 },
  { date: "2026-09-17", total: 9800 },
  { date: "2026-09-18", total: 18200 },
  { date: "2026-09-19", total: 21000 },
  { date: "2026-09-20", total: 17600 },
  { date: "2026-09-21", total: 22450 },
];

const LOW_STOCK: LowStockItem[] = [
  { id: "1", name: "أرز أبو كاس ٥ كجم", stockQty: 4, minStockQty: 10, unitName: "كيس" },
  { id: "2", name: "زيت عافية ١.٥ لتر", stockQty: 0, minStockQty: 12, unitName: "زجاجة" },
  { id: "3", name: "سكر ٢ كجم", stockQty: 6, minStockQty: 15, unitName: "كيس" },
];

const TOP_DEBTORS: TopDebtorItem[] = [
  { id: "1", name: "بقالة النور", balance: "4250.00" },
  { id: "2", name: "سوبر ماركت الأمانة", balance: "3100.50" },
  { id: "3", name: "محمد عبد الرحمن", balance: "1875.00" },
];

const RECENT_INVOICES: RecentInvoiceItem[] = [
  { id: "1", number: 1042, partyName: "بقالة النور", total: "1250.00", paymentStatus: "PARTIAL", issuedAt: "2026-09-21" },
  { id: "2", number: 1041, partyName: "عميل نقدي", total: "340.00", paymentStatus: "PAID", issuedAt: "2026-09-21" },
  { id: "3", number: 1040, partyName: "سوبر ماركت الأمانة", total: "2100.00", paymentStatus: "UNPAID", issuedAt: "2026-09-20" },
];

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <div className="flex flex-col gap-6">
        <KpiRow
          todaySales="22,450.00 ج.م"
          todaySalesDelta={{ value: "+12.4%", tone: "success" }}
          todayPurchases="14,900.00 ج.م"
          todayPurchasesDelta={{ value: "+3.1%", tone: "success" }}
          invoiceCount={38}
          invoiceCountDelta={{ value: "+5", tone: "success" }}
          totalReceivables="9,225.50 ج.م"
        />
        <QuickActions />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SalesTrendChart data={SALES_TREND} />
          </div>
          <LowStockPanel items={LOW_STOCK} />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopDebtorsPanel items={TOP_DEBTORS} />
          <RecentInvoices items={RECENT_INVOICES} />
        </div>
      </div>
    </>
  );
}
