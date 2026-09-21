import { Money } from "@/components/shared/money";
import { formatDate } from "@/lib/format";
import type { ReportChartPoint, ReportKey, ReportTableColumn } from "@/types";

type ReportDefinition = {
  columns: ReportTableColumn[];
  rows: Record<string, React.ReactNode>[];
  footerRow?: Record<string, React.ReactNode>;
  chart?: { title: string; data: ReportChartPoint[] };
};

const SALES_DATA: ReportChartPoint[] = [
  { label: "2026-09-21", value: 22450 },
  { label: "2026-09-20", value: 17600 },
  { label: "2026-09-19", value: 21000 },
  { label: "2026-09-18", value: 18200 },
];

const PURCHASES_DATA: ReportChartPoint[] = [
  { label: "2026-09-20", value: 8400 },
  { label: "2026-09-01", value: 12500 },
];

export function getReportDefinition(key: ReportKey): ReportDefinition {
  switch (key) {
    case "sales":
      return {
        chart: { title: "اتجاه المبيعات", data: SALES_DATA },
        columns: [
          { key: "date", label: "التاريخ" },
          { key: "invoiceCount", label: "عدد الفواتير" },
          { key: "total", label: "الإجمالي", align: "end" },
        ],
        rows: SALES_DATA.map((d) => ({
          date: formatDate(d.label),
          invoiceCount: Math.round(d.value / 400),
          total: <Money value={String(d.value)} />,
        })),
        footerRow: {
          date: "الإجمالي",
          invoiceCount: SALES_DATA.reduce((s, d) => s + Math.round(d.value / 400), 0),
          total: <Money value={String(SALES_DATA.reduce((s, d) => s + d.value, 0))} />,
        },
      };
    case "purchases":
      return {
        chart: { title: "اتجاه المشتريات", data: PURCHASES_DATA },
        columns: [
          { key: "date", label: "التاريخ" },
          { key: "supplier", label: "المورد" },
          { key: "total", label: "الإجمالي", align: "end" },
        ],
        rows: [
          { date: formatDate("2026-09-20"), supplier: "شركة الدلتا للمواد الغذائية", total: <Money value="8400.00" /> },
          { date: formatDate("2026-09-01"), supplier: "شركة الدلتا للمواد الغذائية", total: <Money value="12500.00" /> },
        ],
      };
    case "inventory":
      return {
        columns: [
          { key: "product", label: "الصنف" },
          { key: "qty", label: "الكمية" },
          { key: "valueAtCost", label: "القيمة بالتكلفة", align: "end" },
        ],
        rows: [
          { product: "أرز أبو كاس ٥ كجم", qty: "42 كيس", valueAtCost: <Money value="4137.00" /> },
          { product: "سكر ٢ كجم", qty: "6 كيس", valueAtCost: <Money value="295.20" /> },
        ],
        footerRow: { product: "الإجمالي", qty: "", valueAtCost: <Money value="4432.20" /> },
      };
    case "customers":
      return {
        columns: [
          { key: "name", label: "العميل" },
          { key: "invoiceCount", label: "عدد الفواتير" },
          { key: "balance", label: "الرصيد", align: "end" },
        ],
        rows: [
          { name: "بقالة النور", invoiceCount: 3, balance: <Money value="4250.00" /> },
          { name: "سوبر ماركت الأمانة", invoiceCount: 1, balance: <Money value="3100.50" /> },
        ],
      };
    case "suppliers":
      return {
        columns: [
          { key: "name", label: "المورد" },
          { key: "invoiceCount", label: "عدد الفواتير" },
          { key: "balance", label: "الرصيد", align: "end" },
        ],
        rows: [{ name: "شركة الدلتا للمواد الغذائية", invoiceCount: 2, balance: <Money value="8400.00" /> }],
      };
    case "cashboxes":
      return {
        columns: [
          { key: "name", label: "الخزينة" },
          { key: "movementCount", label: "عدد الحركات" },
          { key: "balance", label: "الرصيد", align: "end" },
        ],
        rows: [
          { name: "نقدي", movementCount: 3, balance: <Money value="12450.00" /> },
          { name: "فودافون كاش", movementCount: 1, balance: <Money value="3200.50" /> },
        ],
        footerRow: { name: "الإجمالي", movementCount: "", balance: <Money value="15650.50" /> },
      };
    case "collections":
      return {
        columns: [
          { key: "date", label: "التاريخ" },
          { key: "customer", label: "العميل" },
          { key: "amount", label: "المبلغ", align: "end" },
        ],
        rows: [{ date: formatDate("2026-09-15"), customer: "بقالة النور", amount: <Money value="500.00" /> }],
      };
    case "payments":
      return {
        columns: [
          { key: "date", label: "التاريخ" },
          { key: "supplier", label: "المورد" },
          { key: "amount", label: "المبلغ", align: "end" },
        ],
        rows: [{ date: formatDate("2026-09-20"), supplier: "شركة الدلتا للمواد الغذائية", amount: <Money value="4000.00" /> }],
      };
    case "profit-loss":
      return {
        chart: {
          title: "الأرباح مقابل التكلفة",
          data: [
            { label: "2026-09-21", value: 4200 },
            { label: "2026-09-20", value: 3100 },
          ],
        },
        columns: [
          { key: "label", label: "البند" },
          { key: "amount", label: "المبلغ", align: "end" },
        ],
        rows: [
          { label: "الإيرادات", amount: <Money value="41050.00" /> },
          { label: "تكلفة البضاعة المباعة", amount: <Money value="-28500.00" /> },
          { label: "الخصومات", amount: <Money value="-450.00" /> },
        ],
        footerRow: { label: "صافي الربح", amount: <Money value="12100.00" /> },
      };
  }
}
