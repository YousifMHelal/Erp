import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceDetailView } from "@/components/shared/invoice/invoice-detail-view";
import type { InvoiceDetail } from "@/types";

const INVOICE: InvoiceDetail = {
  id: "1",
  number: 1042,
  type: "SALE",
  status: "CONFIRMED",
  paymentStatus: "PARTIAL",
  partyName: "بقالة النور",
  partyPhone: "01012345678",
  partyBalance: "4250.00",
  cashboxName: "نقدي",
  userName: "أحمد سعيد",
  issuedAt: "2026-09-21",
  subtotal: "1450.00",
  discountAmount: "200.00",
  total: "1250.00",
  paidAmount: "600.00",
  remainingAmount: "650.00",
  lines: [
    { id: "1", productName: "أرز أبو كاس ٥ كجم", unitName: "كيس", qty: 5, unitPrice: "120.00", lineTotal: "600.00" },
    { id: "2", productName: "سكر ٢ كجم", unitName: "كيس", qty: 6, unitPrice: "60.00", lineTotal: "360.00" },
    { id: "3", productName: "زيت عافية ١.٥ لتر", unitName: "زجاجة", qty: 6, unitPrice: "80.00", lineTotal: "480.00" },
  ],
};

export default function InvoiceDetailPage() {
  const t = useTranslations("invoices.detail");

  return (
    <>
      <PageHeader
        title={t("title", { number: String(INVOICE.number).padStart(6, "0") })}
        breadcrumbs={[{ labelKey: "nav.sales", href: "/sales" }, { labelKey: "invoices.detail.breadcrumbSale" }]}
      />
      <InvoiceDetailView invoice={INVOICE} />
    </>
  );
}
