import { PageHeader } from "@/components/shared/page-header";
import { PartyDetailView } from "@/components/shared/party/party-detail-view";
import type { PartyDetail, PartyInvoiceRow, PartyPaymentRow, StatementLine } from "@/types";

const CUSTOMER: PartyDetail = {
  id: "1",
  name: "بقالة النور",
  phone: "01012345678",
  address: "شارع الجمهورية، المنصورة",
  balance: "4250.00",
  openingBalance: "1000.00",
  totalInvoiced: "18500.00",
  notes: "عميل منتظم منذ ٢٠٢٤",
  createdAt: "2024-03-01",
};

const INVOICES: PartyInvoiceRow[] = [
  { id: "1", number: 1042, total: "1250.00", paymentStatus: "PARTIAL", status: "CONFIRMED", issuedAt: "2026-09-21" },
  { id: "2", number: 1020, total: "890.00", paymentStatus: "PAID", status: "CONFIRMED", issuedAt: "2026-09-10" },
  { id: "3", number: 998, total: "560.00", paymentStatus: "PAID", status: "CANCELLED", issuedAt: "2026-08-28" },
];

const PAYMENTS: PartyPaymentRow[] = [
  { id: "1", number: 12, amount: "500.00", cashboxName: "نقدي", occurredAt: "2026-09-15" },
  { id: "2", number: 9, amount: "300.00", cashboxName: "فودافون كاش", occurredAt: "2026-08-30" },
];

const STATEMENT: StatementLine[] = [
  { id: "1", date: "2026-08-01", description: "رصيد افتتاحي", debit: "1000.00", credit: "0.00", balanceAfter: "1000.00" },
  { id: "2", date: "2026-08-28", description: "فاتورة #000998", debit: "560.00", credit: "0.00", balanceAfter: "1560.00" },
  { id: "3", date: "2026-08-30", description: "تحصيل دفعة #9", debit: "0.00", credit: "300.00", balanceAfter: "1260.00" },
  { id: "4", date: "2026-09-21", description: "فاتورة #001042", debit: "1250.00", credit: "0.00", balanceAfter: "4250.00" },
];

export default function CustomerDetailPage() {
  return (
    <>
      <PageHeader
        title={CUSTOMER.name}
        breadcrumbs={[{ labelKey: "nav.customers", href: "/customers" }, { labelKey: "parties.detail.breadcrumb" }]}
      />
      <PartyDetailView partyType="CUSTOMER" party={CUSTOMER} invoices={INVOICES} payments={PAYMENTS} statement={STATEMENT} />
    </>
  );
}
