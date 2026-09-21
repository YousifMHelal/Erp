import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { SettingsCashboxesTable } from "@/components/settings/settings-cashboxes-table";
import type { SettingsCashboxRow } from "@/types";

const CASHBOXES: SettingsCashboxRow[] = [
  { id: "1", name: "نقدي", isActive: true, sortOrder: 1 },
  { id: "2", name: "فودافون كاش", isActive: true, sortOrder: 2 },
  { id: "3", name: "إنستاباي", isActive: true, sortOrder: 3 },
];

export default function SettingsCashboxesPage() {
  const t = useTranslations("settings");

  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }, { labelKey: "settings.nav.cashboxes" }]} />
      <div className="flex flex-col gap-4">
        <SettingsNav />
        <SettingsCashboxesTable cashboxes={CASHBOXES} />
      </div>
    </>
  );
}
