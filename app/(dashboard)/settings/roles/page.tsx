import { getTranslations } from "next-intl/server";
import { getRoles } from "@/actions/settings.actions";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { RolesView } from "@/components/settings/roles-view";

export default async function SettingsRolesPage() {
  const [t, roles] = await Promise.all([getTranslations("settings"), getRoles()]);
  return <><PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }, { labelKey: "settings.nav.roles" }]} /><div className="flex flex-col gap-4"><SettingsNav /><RolesView roles={roles.success ? roles.data : []} /></div></>;
}
