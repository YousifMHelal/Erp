import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { PrintTemplateForm } from "@/components/settings/print-template-form";
import type { PrintTemplateSettings } from "@/types";

const TEMPLATE: PrintTemplateSettings = {
  templateName: "القالب الافتراضي",
  shop: {
    name: "طيبة",
    phone: "01000000000",
    address: "شارع الجمهورية، المنصورة",
    invoiceFooter: "شكراً لتعاملكم معنا",
  },
  lineColumns: [
    { key: "unitName", labelKey: "columnUnitName", visible: true },
    { key: "sku", labelKey: "columnSku", visible: false },
    { key: "discount", labelKey: "columnDiscount", visible: false },
  ],
};

export default function SettingsPrintTemplatePage() {
  const t = useTranslations("settings");

  return (
    <>
      <PageHeader
        title={t("title")}
        breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }, { labelKey: "settings.nav.printTemplate" }]}
      />
      <div className="flex flex-col gap-4">
        <SettingsNav />
        <PrintTemplateForm template={TEMPLATE} />
      </div>
    </>
  );
}
