import { notFound } from "next/navigation";
import { PrintLayoutA4 } from "@/components/print/print-layout-a4";
import { PrintLayoutA5 } from "@/components/print/print-layout-a5";
import { PrintLayout80mm } from "@/components/print/print-layout-80mm";
import { getSalePrintData } from "@/actions/sales.actions";
import type { PrintPreviewPageProps } from "@/types";

export default async function PrintPreviewPage({ params, searchParams }: PrintPreviewPageProps) {
  const [{ id }, { size }] = await Promise.all([params, searchParams]);
  const result = await getSalePrintData(id);
  if (!result.success) notFound();

  const data = result.data;

  return (
    <div id="print-root" className="min-h-dvh bg-neutral-200 py-8">
      {size === "A5" ? (
        <PrintLayoutA5 data={data} />
      ) : size === "80mm" ? (
        <PrintLayout80mm data={data} />
      ) : (
        <PrintLayoutA4 data={data} />
      )}
    </div>
  );
}
