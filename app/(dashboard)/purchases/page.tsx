import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceList } from "@/components/shared/invoice/invoice-list";
import type { EntityComboboxOption, InvoiceListRow } from "@/types";

const INVOICES: InvoiceListRow[] = [
  { id: "1", number: 512, partyName: "شركة الدلتا للمواد الغذائية", cashboxName: "نقدي", userName: "أحمد سعيد", total: "8400.00", paymentStatus: "PARTIAL", status: "CONFIRMED", issuedAt: "2026-09-20" },
  { id: "2", number: 511, partyName: "مؤسسة النيل للتوزيع", cashboxName: "فودافون كاش", userName: "منى فتحي", total: "3200.00", paymentStatus: "PAID", status: "CONFIRMED", issuedAt: "2026-09-19" },
  { id: "3", number: 510, partyName: "شركة الدلتا للمواد الغذائية", cashboxName: "نقدي", userName: "أحمد سعيد", total: "12500.00", paymentStatus: "UNPAID", status: "CONFIRMED", issuedAt: "2026-09-18" },
  { id: "4", number: 509, partyName: "مؤسسة النيل للتوزيع", cashboxName: "نقدي", userName: "كريم عادل", total: "2100.00", paymentStatus: "PAID", status: "CANCELLED", issuedAt: "2026-09-17" },
];

const SUPPLIERS: EntityComboboxOption[] = [
  { value: "1", label: "شركة الدلتا للمواد الغذائية" },
  { value: "2", label: "مؤسسة النيل للتوزيع" },
];

export default function PurchasesListPage() {
  const t = useTranslations("invoices.list");

  return (
    <>
      <PageHeader title={t("titlePurchase")} breadcrumbs={[{ labelKey: "nav.purchases" }]} />
      <InvoiceList
        documentType="PURCHASE"
        invoices={INVOICES}
        partyOptions={SUPPLIERS}
        newInvoiceHref="/purchases/new"
      />
    </>
  );
}
