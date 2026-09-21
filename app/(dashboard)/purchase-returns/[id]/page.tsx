import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceDetailView } from "@/components/shared/invoice/invoice-detail-view";
import type { InvoiceDetail } from "@/types";

const RETURN: InvoiceDetail = {
  id: "1",
  number: 12,
  type: "PURCHASE_RETURN",
  status: "CONFIRMED",
  paymentStatus: "PAID",
  partyName: "شركة الدلتا للمواد الغذائية",
  partyPhone: "01098765432",
  partyBalance: "8400.00",
  cashboxName: "نقدي",
  userName: "أحمد سعيد",
  issuedAt: "2026-09-19",
  subtotal: "500.00",
  discountAmount: "0.00",
  total: "500.00",
  paidAmount: "500.00",
  remainingAmount: "0.00",
  notes: "مرتجع للفاتورة #000512",
  lines: [{ id: "1", productName: "سكر ٢ كجم", unitName: "كرتونة", qty: 1.25, unitPrice: "400.00", lineTotal: "500.00" }],
};

export default function PurchaseReturnDetailPage() {
  const t = useTranslations("invoices.detail");

  return (
    <>
      <PageHeader
        title={t("title", { number: String(RETURN.number).padStart(6, "0") })}
        breadcrumbs={[
          { labelKey: "nav.purchaseReturns", href: "/purchase-returns" },
          { labelKey: "invoices.detail.breadcrumbPurchase" },
        ]}
      />
      <InvoiceDetailView invoice={RETURN} />
    </>
  );
}
