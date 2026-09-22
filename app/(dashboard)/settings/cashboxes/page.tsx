import { getTranslations } from "next-intl/server";
import { getSettingsCashboxes } from "@/actions/settings.actions";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { SettingsCashboxesTable } from "@/components/settings/settings-cashboxes-table";

export default async function SettingsCashboxesPage() {
  const [t, cashboxes] = await Promise.all([getTranslations("settings"), getSettingsCashboxes()]);
  return <><PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }, { labelKey: "settings.nav.cashboxes" }]} /><div className="flex flex-col gap-4"><SettingsNav /><SettingsCashboxesTable cashboxes={cashboxes.success ? cashboxes.data : []} /></div></>;
}
