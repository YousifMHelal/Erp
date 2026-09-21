import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceList } from "@/components/shared/invoice/invoice-list";
import type { EntityComboboxOption, InvoiceListRow } from "@/types";

const RETURNS: InvoiceListRow[] = [
  { id: "1", number: 12, partyName: "شركة الدلتا للمواد الغذائية", cashboxName: "نقدي", userName: "أحمد سعيد", total: "500.00", paymentStatus: "PAID", status: "CONFIRMED", issuedAt: "2026-09-19" },
];

const SUPPLIERS: EntityComboboxOption[] = [
  { value: "1", label: "شركة الدلتا للمواد الغذائية" },
  { value: "2", label: "مؤسسة النيل للتوزيع" },
];

export default function PurchaseReturnsListPage() {
  const t = useTranslations("returns");

  return (
    <>
      <PageHeader title={t("listPurchaseTitle")} breadcrumbs={[{ labelKey: "nav.purchaseReturns" }]} />
      <InvoiceList
        documentType="PURCHASE"
        invoices={RETURNS}
        partyOptions={SUPPLIERS}
        newInvoiceHref="/purchase-returns/new"
        detailBasePath="/purchase-returns"
        newInvoiceLabel={t("newReturnLabel")}
      />
    </>
  );
}
