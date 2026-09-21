import { FileDown, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function ExportButtons() {
  const t = useTranslations("reports");

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm">
        <FileDown /> {t("exportCsv")}
      </Button>
      <Button type="button" variant="outline" size="sm">
        <Printer /> {t("exportPdf")}
      </Button>
    </div>
  );
}
