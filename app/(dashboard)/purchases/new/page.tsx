import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceForm } from "@/components/shared/invoice/invoice-form";
import type { EntityComboboxOption, SearchableProduct } from "@/types";

const PRODUCTS: SearchableProduct[] = [
  {
    id: "1",
    name: "أرز أبو كاس ٥ كجم",
    sku: "RIC-001",
    barcode: "6221031001015",
    baseUnitName: "كرتونة",
    subUnitName: "كيس",
    unitsPerBase: 10,
    pricePerBase: "1000.00",
    pricePerSub: "100.00",
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
    pricePerBase: "780.00",
    pricePerSub: "65.00",
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
    pricePerBase: "400.00",
    pricePerSub: "50.00",
    stockQty: 16,
  },
];

const SUPPLIERS: EntityComboboxOption[] = [
  { value: "1", label: "شركة الدلتا للمواد الغذائية", description: "رصيد حالي: 8,400.00 ج.م" },
  { value: "2", label: "مؤسسة النيل للتوزيع" },
];

const CASHBOXES: EntityComboboxOption[] = [
  { value: "1", label: "نقدي" },
  { value: "2", label: "فودافون كاش" },
  { value: "3", label: "إنستاباي" },
];

export default function NewPurchasePage() {
  const t = useTranslations("invoices.form");

  return (
    <div className="flex min-h-[calc(100dvh-9.5rem)] flex-col">
      <PageHeader
        title={t("titlePurchase")}
        breadcrumbs={[{ labelKey: "nav.purchases", href: "/purchases" }, { labelKey: "invoices.form.titlePurchase" }]}
      />
      <InvoiceForm documentType="PURCHASE" products={PRODUCTS} partyOptions={SUPPLIERS} cashboxOptions={CASHBOXES} />
    </div>
  );
}
