import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceDetailView } from "@/components/shared/invoice/invoice-detail-view";
import type { InvoiceDetail } from "@/types";

const RETURN: InvoiceDetail = {
  id: "1",
  number: 34,
  type: "SALE_RETURN",
  status: "CONFIRMED",
  paymentStatus: "PAID",
  partyName: "بقالة النور",
  partyPhone: "01012345678",
  partyBalance: "4250.00",
  cashboxName: "نقدي",
  userName: "أحمد سعيد",
  issuedAt: "2026-09-20",
  subtotal: "180.00",
  discountAmount: "0.00",
  total: "180.00",
  paidAmount: "180.00",
  remainingAmount: "0.00",
  notes: "مرتجع للفاتورة #001042",
  lines: [{ id: "1", productName: "سكر ٢ كجم", unitName: "كيس", qty: 2, unitPrice: "60.00", lineTotal: "120.00" }],
};

export default function SalesReturnDetailPage() {
  const t = useTranslations("invoices.detail");

  return (
    <>
      <PageHeader
        title={t("title", { number: String(RETURN.number).padStart(6, "0") })}
        breadcrumbs={[{ labelKey: "nav.salesReturns", href: "/sales-returns" }, { labelKey: "invoices.detail.breadcrumbSale" }]}
      />
      <InvoiceDetailView invoice={RETURN} />
    </>
  );
}
