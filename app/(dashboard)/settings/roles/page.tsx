import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { RolesView } from "@/components/settings/roles-view";
import type { RoleRow } from "@/types";

const ROLES: RoleRow[] = [
  { id: "1", name: "مدير النظام", description: "صلاحيات كاملة على النظام", isSystem: true, userCount: 1 },
  { id: "2", name: "محاسب", description: "المبيعات والمشتريات والتقارير", isSystem: false, userCount: 1 },
  { id: "3", name: "كاشير", description: "المبيعات فقط", isSystem: false, userCount: 2 },
];

export default function SettingsRolesPage() {
  const t = useTranslations("settings");

  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }, { labelKey: "settings.nav.roles" }]} />
      <div className="flex flex-col gap-4">
        <SettingsNav />
        <RolesView roles={ROLES} />
      </div>
    </>
  );
}
