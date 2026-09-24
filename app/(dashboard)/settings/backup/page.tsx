import { ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getSettingsOverview } from "@/actions/settings.actions";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { BackupPanel } from "@/components/settings/backup-panel";

export default async function SettingsBackupPage() {
  const [t, overview] = await Promise.all([getTranslations("settings"), getSettingsOverview()]);
  const breadcrumbs = [{ labelKey: "nav.settings", href: "/settings" }, { labelKey: "settings.nav.backup" }];

  if (!overview.success) {
    return (
      <>
        <PageHeader title={t("title")} breadcrumbs={breadcrumbs} />
        <EmptyState icon={<ShieldAlert className="size-6" />} title={overview.error} />
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={breadcrumbs} />
      <div className="flex flex-col gap-4">
        <SettingsNav />
        <BackupPanel />
      </div>
    </>
  );
}
