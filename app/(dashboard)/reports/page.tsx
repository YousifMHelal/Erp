import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { ReportPicker } from "@/components/reports/report-picker";

export default function ReportsHubPage() {
  const t = useTranslations("reports");

  return (
    <>
      <PageHeader title={t("hubTitle")} description={t("hubDescription")} breadcrumbs={[{ labelKey: "nav.reports" }]} />
      <ReportPicker />
    </>
  );
}
