import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { PrintTemplateForm } from "@/components/settings/print-template-form";
import { EmptyState } from "@/components/shared/empty-state";
import { getPrintTemplate, getSettingsOverview } from "@/actions/settings.actions";
import { buildDefaultPrintLayout } from "@/lib/print-template";
import type { PrintTemplateSettings } from "@/types";

export default async function SettingsPrintTemplatePage() {
  const t = await getTranslations("settings");
  const [overview, saved] = await Promise.all([getSettingsOverview(), getPrintTemplate()]);
  const breadcrumbs = [{ labelKey: "nav.settings", href: "/settings" }, { labelKey: "settings.nav.printTemplate" }];

  if (!overview.success) {
    return (
      <>
        <PageHeader title={t("title")} breadcrumbs={breadcrumbs} />
        <EmptyState title={overview.error} />
      </>
    );
  }

  const { profile } = overview.data;
  const layout = (saved.success ? saved.data.layout : null) ?? (await buildDefaultPrintLayout());

  const template: PrintTemplateSettings = {
    templateName: layout.templateName,
    shop: {
      name: profile.name,
      phone: profile.phone,
      phone2: saved.success ? saved.data.phone2 : undefined,
      address: profile.address,
      invoiceFooter: profile.invoiceFooter ?? "",
      logoDataUrl: layout.logoDataUrl,
    },
    lineColumns: layout.lineColumns,
    infoColumns: layout.infoColumns,
    totalsRows: layout.totalsRows,
  };

  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={breadcrumbs} />
      <div className="flex flex-col gap-4">
        <SettingsNav />
        <PrintTemplateForm template={template} />
      </div>
    </>
  );
}
