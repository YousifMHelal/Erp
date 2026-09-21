import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { ReturnForm } from "@/components/shared/returns/return-form";
import type { EntityComboboxOption, OriginalInvoiceLine, OriginalInvoiceOption } from "@/types";

const ORIGINAL_INVOICES: OriginalInvoiceOption[] = [
  { id: "1", number: 1042, partyName: "بقالة النور", issuedAt: "2026-09-21", total: "1250.00" },
  { id: "2", number: 1040, partyName: "سوبر ماركت الأمانة", issuedAt: "2026-09-20", total: "2100.00" },
];

const ORIGINAL_INVOICE_LINES: Record<string, OriginalInvoiceLine[]> = {
  "1": [
    { id: "l1", productId: "1", productName: "أرز أبو كاس ٥ كجم", unitName: "كيس", qtyInvoiced: 5, qtyAlreadyReturned: 0, unitPrice: "120.00" },
    { id: "l2", productId: "3", productName: "سكر ٢ كجم", unitName: "كيس", qtyInvoiced: 6, qtyAlreadyReturned: 2, unitPrice: "60.00" },
  ],
  "2": [{ id: "l3", productId: "2", productName: "زيت عافية ١.٥ لتر", unitName: "زجاجة", qtyInvoiced: 10, qtyAlreadyReturned: 0, unitPrice: "80.00" }],
};

const CASHBOXES: EntityComboboxOption[] = [
  { value: "1", label: "نقدي" },
  { value: "2", label: "فودافون كاش" },
];

export default function NewSalesReturnPage() {
  const t = useTranslations("returns");

  return (
    <>
      <PageHeader
        title={t("newSaleTitle")}
        breadcrumbs={[{ labelKey: "nav.salesReturns", href: "/sales-returns" }, { labelKey: "returns.newSaleTitle" }]}
      />
      <ReturnForm
        documentType="SALE_RETURN"
        originalInvoices={ORIGINAL_INVOICES}
        originalInvoiceLines={ORIGINAL_INVOICE_LINES}
        cashboxOptions={CASHBOXES}
      />
    </>
  );
}
