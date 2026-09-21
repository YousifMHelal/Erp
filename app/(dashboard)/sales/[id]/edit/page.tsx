import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceForm } from "@/components/shared/invoice/invoice-form";
import type { EntityComboboxOption, InvoiceFormInitialData, SearchableProduct } from "@/types";

const PRODUCTS: SearchableProduct[] = [
  {
    id: "1",
    name: "أرز أبو كاس ٥ كجم",
    sku: "RIC-001",
    barcode: "6221031001015",
    baseUnitName: "كرتونة",
    subUnitName: "كيس",
    unitsPerBase: 10,
    pricePerBase: "1200.00",
    pricePerSub: "120.00",
    stockQty: 42,
  },
  {
    id: "2",
    name: "زيت عافية ١.٥ لتر",
    sku: "OIL-014",
    barcode: "6221031001022",
    baseUnitName: "كرتونة",
    subUnitName: "زجاجة",
    unitsPerBase: 12,
    pricePerBase: "960.00",
    pricePerSub: "80.00",
    stockQty: 0,
  },
  {
    id: "3",
    name: "سكر ٢ كجم",
    sku: "SUG-007",
    barcode: "6221031001039",
    baseUnitName: "كرتونة",
    subUnitName: "كيس",
    unitsPerBase: 8,
    pricePerBase: "480.00",
    pricePerSub: "60.00",
    stockQty: 16,
  },
  {
    id: "4",
    name: "شاي العروسة ٥٠ فتلة",
    sku: "TEA-003",
    barcode: "6221031001046",
    baseUnitName: "كرتونة",
    subUnitName: "علبة",
    unitsPerBase: 24,
    pricePerBase: "720.00",
    pricePerSub: "30.00",
    stockQty: 58,
  },
];

const CUSTOMERS: EntityComboboxOption[] = [
  { value: "1", label: "بقالة النور", description: "رصيد حالي: 4,250.00 ج.م" },
  { value: "2", label: "سوبر ماركت الأمانة", description: "رصيد حالي: 3,100.50 ج.م" },
  { value: "3", label: "محمد عبد الرحمن" },
];

const CASHBOXES: EntityComboboxOption[] = [
  { value: "1", label: "نقدي" },
  { value: "2", label: "فودافون كاش" },
  { value: "3", label: "إنستاباي" },
];

// Static stand-in for the sale being edited — Phase 2 has no backend, so the invoice
// this route edits is the same fixture used by /sales/[id]. Real fetch-by-id lands with P4-9.
const INITIAL_INVOICE: InvoiceFormInitialData = {
  number: "001042",
  partyId: "1",
  cashboxId: "1",
  discountAmount: 200,
  paidAmount: 600,
  lines: [
    {
      lineId: "line-1",
      productId: "1",
      productName: "أرز أبو كاس ٥ كجم",
      unitType: "SUB",
      baseUnitName: "كرتونة",
      subUnitName: "كيس",
      unitsPerBase: 10,
      qty: 5,
      unitPrice: 120,
      lineTotal: 600,
    },
    {
      lineId: "line-2",
      productId: "3",
      productName: "سكر ٢ كجم",
      unitType: "SUB",
      baseUnitName: "كرتونة",
      subUnitName: "كيس",
      unitsPerBase: 8,
      qty: 6,
      unitPrice: 60,
      lineTotal: 360,
    },
    {
      lineId: "line-3",
      productId: "2",
      productName: "زيت عافية ١.٥ لتر",
      unitType: "SUB",
      baseUnitName: "كرتونة",
      subUnitName: "زجاجة",
      unitsPerBase: 12,
      qty: 6,
      unitPrice: 80,
      lineTotal: 480,
    },
  ],
};

export default function EditSalePage() {
  const t = useTranslations("invoices.form");

  return (
    <div className="flex min-h-[calc(100dvh-9.5rem)] flex-col">
      <PageHeader
        title={t("titleEditSale", { number: INITIAL_INVOICE.number })}
        breadcrumbs={[
          { labelKey: "nav.sales", href: "/sales" },
          { labelKey: "invoices.detail.breadcrumbEditSale" },
        ]}
      />
      <InvoiceForm
        documentType="SALE"
        products={PRODUCTS}
        partyOptions={CUSTOMERS}
        cashboxOptions={CASHBOXES}
        initialInvoice={INITIAL_INVOICE}
      />
    </div>
  );
}
