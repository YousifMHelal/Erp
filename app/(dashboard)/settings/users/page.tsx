import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { UsersTable } from "@/components/settings/users-table";
import type { SettingsUserRow } from "@/types";

const USERS: SettingsUserRow[] = [
  { id: "1", displayName: "أحمد سعيد", username: "ahmed", roleName: "مدير", isActive: true, lastLoginAt: "2026-09-21" },
  { id: "2", displayName: "منى فتحي", username: "mona", roleName: "محاسب", isActive: true, lastLoginAt: "2026-09-20" },
  { id: "3", displayName: "كريم عادل", username: "karim", roleName: "كاشير", isActive: true, lastLoginAt: "2026-09-21" },
  { id: "4", displayName: "سارة حسن", username: "sara", roleName: "كاشير", isActive: false },
];

export default function SettingsUsersPage() {
  const t = useTranslations("settings");

  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }, { labelKey: "settings.nav.users" }]} />
      <div className="flex flex-col gap-4">
        <SettingsNav />
        <UsersTable users={USERS} />
      </div>
    </>
  );
}
