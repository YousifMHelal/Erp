import { ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getBackupReminder } from "@/actions/backup.actions";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { BackupPanel } from "@/components/settings/backup-panel";

export default async function SettingsBackupPage() {
  const [t, reminder] = await Promise.all([getTranslations("settings"), getBackupReminder()]);
  const breadcrumbs = [{ labelKey: "nav.settings", href: "/settings" }, { labelKey: "settings.nav.backup" }];

  if (!reminder.success) {
    return (
      <>
        <PageHeader title={t("title")} breadcrumbs={breadcrumbs} />
        <EmptyState icon={<ShieldAlert className="size-6" />} title={reminder.error} />
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={breadcrumbs} />
      <div className="flex flex-col gap-4">
        <SettingsNav />
        <BackupPanel reminder={reminder.data} />
      </div>
    </>
  );
}
