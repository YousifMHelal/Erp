import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceForm } from "@/components/sales/invoice-form";
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
    sellPricePerBase: "1200.00",
    sellPricePerSub: "120.00",
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
    sellPricePerBase: "960.00",
    sellPricePerSub: "80.00",
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
    sellPricePerBase: "480.00",
    sellPricePerSub: "60.00",
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
    sellPricePerBase: "720.00",
    sellPricePerSub: "30.00",
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

export default function NewSalePage() {
  const t = useTranslations("sales.new");

  return (
    <div className="flex min-h-[calc(100dvh-9.5rem)] flex-col">
      <PageHeader
        title={t("title")}
        breadcrumbs={[{ labelKey: "nav.sales", href: "/sales" }, { labelKey: "sales.new.title" }]}
      />
      <InvoiceForm products={PRODUCTS} customerOptions={CUSTOMERS} cashboxOptions={CASHBOXES} />
    </div>
  );
}
