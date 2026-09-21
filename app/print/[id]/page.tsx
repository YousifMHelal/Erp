import { PrintLayoutA4 } from "@/components/print/print-layout-a4";
import { PrintLayoutA5 } from "@/components/print/print-layout-a5";
import { PrintLayout80mm } from "@/components/print/print-layout-80mm";
import type { PrintInvoiceData } from "@/types";

const SAMPLE_DATA: PrintInvoiceData = {
  shop: {
    name: "طيبة",
    phone: "01000000000",
    phone2: "01000000001",
    address: "شارع الجمهورية، المنصورة",
    invoiceFooter: "شكراً لتعاملكم معنا",
  },
  documentTypeLabel: "فاتورة بيع",
  number: 1042,
  issuedAt: "2026-09-21",
  issuedTime: "2:40 م",
  cashierName: "أحمد سعيد",
  staffContacts: [
    { name: "محمد فوزي", phone: "01110292946" },
    { name: "محمود فوزي", phone: "01110092920" },
  ],
  partyLabel: "العميل",
  partyCompanyName: "شركة الخلود لتجارة المنظفات",
  partyName: "بقالة النور",
  partyPhone: "01012345678",
  partyAddress: "قليوب البلد",
  lines: [
    { productCode: "194", productName: "أرز أبو كاس ٥ كجم", unitName: "كيس", qty: 5, unitPrice: "120.00", lineTotal: "600.00" },
    { productCode: "93", productName: "سكر ٢ كجم", unitName: "كيس", qty: 6, unitPrice: "60.00", lineTotal: "360.00" },
    { productCode: "11", productName: "زيت عافية ١.٥ لتر", unitName: "زجاجة", qty: 6, unitPrice: "80.00", lineTotal: "480.00" },
  ],
  subtotal: "1450.00",
  discountAmount: "200.00",
  total: "1250.00",
  paidAmount: "600.00",
  remainingAmount: "650.00",
  previousBalance: "0.00",
  currentBalance: "650.00",
};

export default async function PrintPreviewPage({
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ size?: string }>;
}) {
  const { size } = await searchParams;

  return (
    <div id="print-root" className="min-h-dvh bg-neutral-200 py-8">
      {size === "A5" ? (
        <PrintLayoutA5 data={SAMPLE_DATA} />
      ) : size === "80mm" ? (
        <PrintLayout80mm data={SAMPLE_DATA} />
      ) : (
        <PrintLayoutA4 data={SAMPLE_DATA} />
      )}
    </div>
  );
}
