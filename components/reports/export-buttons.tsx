"use client";

import { useState } from "react";
import { FileDown, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { exportReportCsv } from "@/actions/reports.actions";
import { Button } from "@/components/ui/button";
import type { ExportButtonsProps } from "@/types";

export function ExportButtons({ reportKey, filters }: ExportButtonsProps) {
  const t = useTranslations("reports");
  const [isExporting, setIsExporting] = useState(false);

  async function downloadCsv() {
    setIsExporting(true);
    const exported = await exportReportCsv({ reportKey, ...filters });
    setIsExporting(false);
    if (!exported.success) return toast.error(exported.error);
    const url = URL.createObjectURL(new Blob([exported.data], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${reportKey}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button type="button" variant="outline" size="sm" disabled={isExporting} onClick={downloadCsv}>
        <FileDown /> {t("exportCsv")}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
        <Printer /> {t("exportPdf")}
      </Button>
    </div>
  );
}
