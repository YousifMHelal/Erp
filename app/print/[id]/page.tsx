import { notFound } from "next/navigation";
import { PrintLayoutA4 } from "@/components/print/print-layout-a4";
import { PrintLayoutA5 } from "@/components/print/print-layout-a5";
import { PrintLayout80mm } from "@/components/print/print-layout-80mm";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { getSalePrintData } from "@/actions/sales.actions";
import { getPurchasePrintData } from "@/actions/purchases.actions";
import { getReturnPrintData } from "@/actions/returns.actions";
import { prisma } from "@/lib/prisma";
import { resolvePrintTemplateLayout } from "@/lib/print-template";
import type { PrintPreviewPageProps } from "@/types";

/** The four document types share one `Invoice` id space but each has its own print-data getter (different party/permission). */
async function loadPrintData(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { type: true },
  });
  if (!invoice) return null;
  switch (invoice.type) {
    case "SALE":
      return getSalePrintData(id);
    case "PURCHASE":
      return getPurchasePrintData(id);
    case "SALE_RETURN":
    case "PURCHASE_RETURN":
      return getReturnPrintData(id);
  }
}

export default async function PrintPreviewPage({ params, searchParams }: PrintPreviewPageProps) {
  const [{ id }, { size, action }] = await Promise.all([params, searchParams]);
  const [result, template] = await Promise.all([loadPrintData(id), resolvePrintTemplateLayout()]);
  if (!result?.success) notFound();

  const data = template.logoDataUrl
    ? { ...result.data, shop: { ...result.data.shop, logoDataUrl: template.logoDataUrl } }
    : result.data;
  const autoAction = action === "print" || action === "copy" ? action : undefined;

  return (
    <div id="print-root" className="min-h-dvh bg-neutral-200 py-8">
      <PrintToolbar
        targetId="print-document"
        fileName={`invoice-${String(data.number).padStart(6, "0")}.png`}
        autoAction={autoAction}
      />
      <div id="print-document" className="mx-auto w-fit">
        {size === "A5" ? (
          <PrintLayoutA5 data={data} infoColumns={template.infoColumns} totalsRows={template.totalsRows} />
        ) : size === "80mm" ? (
          <PrintLayout80mm data={data} totalsRows={template.totalsRows} />
        ) : (
          <PrintLayoutA4 data={data} infoColumns={template.infoColumns} totalsRows={template.totalsRows} />
        )}
      </div>
    </div>
  );
}
