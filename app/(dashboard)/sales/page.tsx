import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceList } from "@/components/shared/invoice/invoice-list";
import type { EntityComboboxOption, InvoiceListRow } from "@/types";

const INVOICES: InvoiceListRow[] = [
  { id: "1", number: 1042, partyName: "بقالة النور", cashboxName: "نقدي", userName: "أحمد سعيد", total: "1250.00", paymentStatus: "PARTIAL", status: "CONFIRMED", issuedAt: "2026-09-21" },
  { id: "2", number: 1041, partyName: "عميل نقدي", cashboxName: "نقدي", userName: "كريم عادل", total: "340.00", paymentStatus: "PAID", status: "CONFIRMED", issuedAt: "2026-09-21" },
  { id: "3", number: 1040, partyName: "سوبر ماركت الأمانة", cashboxName: "فودافون كاش", userName: "منى فتحي", total: "2100.00", paymentStatus: "UNPAID", status: "CONFIRMED", issuedAt: "2026-09-20" },
  { id: "4", number: 1039, partyName: "محمد عبد الرحمن", cashboxName: "نقدي", userName: "أحمد سعيد", total: "560.00", paymentStatus: "PAID", status: "CANCELLED", issuedAt: "2026-09-19" },
  { id: "5", number: 1038, partyName: "عميل نقدي", cashboxName: "إنستاباي", userName: "سارة حسن", total: "980.00", paymentStatus: "PAID", status: "CONFIRMED", issuedAt: "2026-09-19" },
];

const CUSTOMERS: EntityComboboxOption[] = [
  { value: "1", label: "بقالة النور" },
  { value: "2", label: "سوبر ماركت الأمانة" },
  { value: "3", label: "محمد عبد الرحمن" },
];

export default function SalesListPage() {
  const t = useTranslations("invoices.list");

  return (
    <>
      <PageHeader title={t("titleSale")} breadcrumbs={[{ labelKey: "nav.sales" }]} />
      <InvoiceList documentType="SALE" invoices={INVOICES} partyOptions={CUSTOMERS} newInvoiceHref="/sales/new" />
    </>
  );
}
