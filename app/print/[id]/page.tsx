import { PrintLayoutA4 } from "@/components/print/print-layout-a4";
import { PrintLayoutA5 } from "@/components/print/print-layout-a5";
import { PrintLayout80mm } from "@/components/print/print-layout-80mm";
import type { PrintInvoiceData } from "@/types";

const SAMPLE_DATA: PrintInvoiceData = {
  shop: {
    name: "طيبة",
    phone: "01000000000",
    address: "شارع الجمهورية، المنصورة",
    invoiceFooter: "شكراً لتعاملكم معنا",
  },
  documentTypeLabel: "فاتورة بيع",
  number: 1042,
  issuedAt: "2026-09-21",
  cashierName: "أحمد سعيد",
  partyLabel: "العميل",
  partyName: "بقالة النور",
  partyPhone: "01012345678",
  lines: [
    { productName: "أرز أبو كاس ٥ كجم", unitName: "كيس", qty: 5, unitPrice: "120.00", lineTotal: "600.00" },
    { productName: "سكر ٢ كجم", unitName: "كيس", qty: 6, unitPrice: "60.00", lineTotal: "360.00" },
    { productName: "زيت عافية ١.٥ لتر", unitName: "زجاجة", qty: 6, unitPrice: "80.00", lineTotal: "480.00" },
  ],
  subtotal: "1450.00",
  discountAmount: "200.00",
  total: "1250.00",
  paidAmount: "600.00",
  remainingAmount: "650.00",
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
