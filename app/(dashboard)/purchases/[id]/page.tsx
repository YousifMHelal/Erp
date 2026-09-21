import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceDetailView } from "@/components/shared/invoice/invoice-detail-view";
import type { InvoiceDetail } from "@/types";

const INVOICE: InvoiceDetail = {
  id: "1",
  number: 512,
  type: "PURCHASE",
  status: "CONFIRMED",
  paymentStatus: "PARTIAL",
  partyName: "شركة الدلتا للمواد الغذائية",
  partyPhone: "01098765432",
  partyBalance: "8400.00",
  cashboxName: "نقدي",
  userName: "أحمد سعيد",
  issuedAt: "2026-09-20",
  subtotal: "8400.00",
  discountAmount: "0.00",
  total: "8400.00",
  paidAmount: "4000.00",
  remainingAmount: "4400.00",
  lines: [
    { id: "1", productName: "أرز أبو كاس ٥ كجم", unitName: "كرتونة", qty: 5, unitPrice: "1000.00", lineTotal: "5000.00" },
    { id: "2", productName: "سكر ٢ كجم", unitName: "كرتونة", qty: 4, unitPrice: "400.00", lineTotal: "1600.00" },
    { id: "3", productName: "زيت عافية ١.٥ لتر", unitName: "كرتونة", qty: 2.3, unitPrice: "780.00", lineTotal: "1800.00" },
  ],
};

export default function PurchaseDetailPage() {
  const t = useTranslations("invoices.detail");

  return (
    <>
      <PageHeader
        title={t("title", { number: String(INVOICE.number).padStart(6, "0") })}
        breadcrumbs={[{ labelKey: "nav.purchases", href: "/purchases" }, { labelKey: "invoices.detail.breadcrumbPurchase" }]}
      />
      <InvoiceDetailView invoice={INVOICE} />
    </>
  );
}
