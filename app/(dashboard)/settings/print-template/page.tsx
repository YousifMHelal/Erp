import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { PrintTemplateForm } from "@/components/settings/print-template-form";
import { EmptyState } from "@/components/shared/empty-state";
import { getSettingsOverview } from "@/actions/settings.actions";
import { DEFAULT_TOTALS_ROWS, createDefaultInfoColumns } from "@/lib/print-fields";
import type { PrintTemplateSettings } from "@/types";

export default async function SettingsPrintTemplatePage() {
  const t = await getTranslations("settings");
  const tFields = await getTranslations("settings.printTemplate.systemFields");
  const tShared = await getTranslations("print");
  const overview = await getSettingsOverview();

  if (!overview.success) {
    return (
      <>
        <PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }, { labelKey: "settings.nav.printTemplate" }]} />
        <EmptyState title={overview.error} />
      </>
    );
  }

  const { profile } = overview.data;

  const template: PrintTemplateSettings = {
    templateName: "",
    shop: {
      name: profile.name,
      phone: profile.phone,
      address: profile.address,
      invoiceFooter: profile.invoiceFooter ?? "",
    },
    lineColumns: [
      { key: "unitName", labelKey: "columnUnitName", visible: true },
      { key: "sku", labelKey: "columnSku", visible: false },
      { key: "discount", labelKey: "columnDiscount", visible: false },
    ],
    infoColumns: createDefaultInfoColumns({
      invoiceNumber: tFields("invoiceNumber"),
      invoiceDate: tFields("invoiceDate"),
      customerName: tFields("customerName"),
      customerCompanyName: tFields("customerCompanyName"),
      customerPhone: tFields("customerPhone"),
      customerAddress: tFields("customerAddress"),
      shopAddress: tShared("shopAddress"),
    }),
    totalsRows: DEFAULT_TOTALS_ROWS,
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }, { labelKey: "settings.nav.printTemplate" }]}
      />
      <div className="flex flex-col gap-4">
        <SettingsNav />
        <PrintTemplateForm template={template} />
      </div>
    </>
  );
}
