import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { ReturnForm } from "@/components/shared/returns/return-form";
import type { EntityComboboxOption, OriginalInvoiceLine, OriginalInvoiceOption } from "@/types";

const ORIGINAL_INVOICES: OriginalInvoiceOption[] = [
  { id: "1", number: 512, partyName: "شركة الدلتا للمواد الغذائية", issuedAt: "2026-09-20", total: "8400.00" },
];

const ORIGINAL_INVOICE_LINES: Record<string, OriginalInvoiceLine[]> = {
  "1": [
    { id: "l1", productId: "1", productName: "أرز أبو كاس ٥ كجم", unitName: "كرتونة", qtyInvoiced: 5, qtyAlreadyReturned: 0, unitPrice: "1000.00" },
    { id: "l2", productId: "3", productName: "سكر ٢ كجم", unitName: "كرتونة", qtyInvoiced: 4, qtyAlreadyReturned: 0, unitPrice: "400.00" },
  ],
};

const CASHBOXES: EntityComboboxOption[] = [
  { value: "1", label: "نقدي" },
  { value: "2", label: "فودافون كاش" },
];

export default function NewPurchaseReturnPage() {
  const t = useTranslations("returns");

  return (
    <>
      <PageHeader
        title={t("newPurchaseTitle")}
        breadcrumbs={[
          { labelKey: "nav.purchaseReturns", href: "/purchase-returns" },
          { labelKey: "returns.newPurchaseTitle" },
        ]}
      />
      <ReturnForm
        documentType="PURCHASE_RETURN"
        originalInvoices={ORIGINAL_INVOICES}
        originalInvoiceLines={ORIGINAL_INVOICE_LINES}
        cashboxOptions={CASHBOXES}
      />
    </>
  );
}
