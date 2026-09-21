import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceList } from "@/components/shared/invoice/invoice-list";
import type { EntityComboboxOption, InvoiceListRow } from "@/types";

const RETURNS: InvoiceListRow[] = [
  { id: "1", number: 34, partyName: "بقالة النور", cashboxName: "نقدي", userName: "أحمد سعيد", total: "180.00", paymentStatus: "PAID", status: "CONFIRMED", issuedAt: "2026-09-20" },
  { id: "2", number: 33, partyName: "عميل نقدي", cashboxName: "نقدي", userName: "كريم عادل", total: "60.00", paymentStatus: "PAID", status: "CONFIRMED", issuedAt: "2026-09-18" },
];

const CUSTOMERS: EntityComboboxOption[] = [
  { value: "1", label: "بقالة النور" },
  { value: "2", label: "سوبر ماركت الأمانة" },
];

export default function SalesReturnsListPage() {
  const t = useTranslations("returns");

  return (
    <>
      <PageHeader title={t("listSaleTitle")} breadcrumbs={[{ labelKey: "nav.salesReturns" }]} />
      <InvoiceList
        documentType="SALE"
        invoices={RETURNS}
        partyOptions={CUSTOMERS}
        newInvoiceHref="/sales-returns/new"
        detailBasePath="/sales-returns"
      />
    </>
  );
}
