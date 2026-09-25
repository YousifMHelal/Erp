"use client";

import { useTranslations } from "next-intl";
import { PrintLayoutA4 } from "@/components/print/print-layout-a4";
import { PrintLayoutA5 } from "@/components/print/print-layout-a5";
import { PrintLayout80mm } from "@/components/print/print-layout-80mm";
import type { PrintInvoiceData, PrintTemplatePreviewProps } from "@/types";

const SAMPLE_LINES: PrintInvoiceData["lines"] = [
  { productName: "أرز أبو كاس ٥ كجم", unitName: "كيس", qty: 5, unitPrice: "120.00", lineTotal: "600.00" },
  { productName: "سكر ٢ كجم", unitName: "كيس", qty: 6, unitPrice: "60.00", lineTotal: "360.00" },
  { productName: "زيت عافية ١.٥ لتر", unitName: "زجاجة", qty: 6, unitPrice: "80.00", lineTotal: "480.00" },
];

const PREVIEW_SCALE: Record<PrintTemplatePreviewProps["size"], number> = {
  A4: 0.52,
  A5: 0.62,
  "80mm": 0.9,
};

export function PrintTemplatePreview({ template, size }: PrintTemplatePreviewProps) {
  const t = useTranslations("settings.printTemplate");

  const sampleData: PrintInvoiceData = {
    shop: {
      name: template.shop.name,
      phone: template.shop.phone,
      address: template.shop.address,
      taxNote: template.shop.taxNote,
      invoiceFooter: template.shop.invoiceFooter,
      logoDataUrl: template.shop.logoDataUrl,
    },
    documentTypeLabel: "فاتورة بيع",
    number: 1042,
    issuedAt: "2026-09-21",
    issuedTime: "3:45 م",
    cashierName: "أحمد سعيد",
    partyLabel: "العميل",
    partyName: "بقالة النور",
    partyCompanyName: "شركة النور للتجارة",
    partyPhone: "01012345678",
    partyAddress: "شارع الجمهورية - بنها",
    lines: SAMPLE_LINES,
    subtotal: "1450.00",
    discountAmount: "200.00",
    total: "1250.00",
    paidAmount: "600.00",
    remainingAmount: "650.00",
  };

  const scale = PREVIEW_SCALE[size];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-label text-muted-foreground">{t("previewTitle")}</span>
      </div>
      <div className="overflow-hidden rounded-md border border-border bg-neutral-bg">
        <div className="flex justify-center overflow-auto p-4">
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
            {size === "A5" ? (
              <PrintLayoutA5 data={sampleData} infoColumns={template.infoColumns} totalsRows={template.totalsRows} />
            ) : size === "80mm" ? (
              <PrintLayout80mm data={sampleData} totalsRows={template.totalsRows} />
            ) : (
              <PrintLayoutA4 data={sampleData} infoColumns={template.infoColumns} totalsRows={template.totalsRows} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
