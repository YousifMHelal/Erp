import { getTranslations } from "next-intl/server";
import { getSettingsUsers } from "@/actions/settings.actions";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { UsersTable } from "@/components/settings/users-table";

export default async function SettingsUsersPage() {
  const [t, data] = await Promise.all([getTranslations("settings"), getSettingsUsers()]);
  const users = data.success ? data.data : { users: [], roles: [] };
  return <><PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }, { labelKey: "settings.nav.users" }]} /><div className="flex flex-col gap-4"><SettingsNav /><UsersTable users={users.users} roleOptions={users.roles} /></div></>;
}
