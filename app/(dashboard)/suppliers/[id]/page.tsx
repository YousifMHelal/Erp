import { PageHeader } from "@/components/shared/page-header";
import { PartyDetailView } from "@/components/shared/party/party-detail-view";
import type { PartyDetail, PartyInvoiceRow, PartyPaymentRow, StatementLine } from "@/types";

const SUPPLIER: PartyDetail = {
  id: "1",
  name: "شركة الدلتا للمواد الغذائية",
  phone: "01098765432",
  address: "المنطقة الصناعية، العاشر من رمضان",
  balance: "8400.00",
  openingBalance: "0.00",
  totalInvoiced: "42500.00",
  notes: "مورد رئيسي للمواد الغذائية",
  createdAt: "2024-01-15",
};

const INVOICES: PartyInvoiceRow[] = [
  { id: "1", number: 512, total: "8400.00", paymentStatus: "PARTIAL", status: "CONFIRMED", issuedAt: "2026-09-20" },
  { id: "2", number: 498, total: "12500.00", paymentStatus: "PAID", status: "CONFIRMED", issuedAt: "2026-09-01" },
];

const PAYMENTS: PartyPaymentRow[] = [
  { id: "1", number: 5, amount: "4000.00", cashboxName: "نقدي", occurredAt: "2026-09-20" },
];

const STATEMENT: StatementLine[] = [
  { id: "1", date: "2026-09-01", description: "فاتورة شراء #000498", debit: "0.00", credit: "12500.00", balanceAfter: "12500.00" },
  { id: "2", date: "2026-09-05", description: "دفعة #4", debit: "12500.00", credit: "0.00", balanceAfter: "0.00" },
  { id: "3", date: "2026-09-20", description: "فاتورة شراء #000512", debit: "0.00", credit: "8400.00", balanceAfter: "8400.00" },
  { id: "4", date: "2026-09-20", description: "دفعة #5", debit: "4000.00", credit: "0.00", balanceAfter: "4400.00" },
];

export default function SupplierDetailPage() {
  return (
    <>
      <PageHeader
        title={SUPPLIER.name}
        breadcrumbs={[{ labelKey: "nav.suppliers", href: "/suppliers" }, { labelKey: "parties.detail.breadcrumb" }]}
      />
      <PartyDetailView partyType="SUPPLIER" party={SUPPLIER} invoices={INVOICES} payments={PAYMENTS} statement={STATEMENT} />
    </>
  );
}
