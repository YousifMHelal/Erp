import { ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getSettingsOverview } from "@/actions/settings.actions";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { ShopProfileForm } from "@/components/settings/shop-profile-form";
import { PrintPrefsForm } from "@/components/settings/print-prefs-form";

export default async function SettingsPage() {
  const [t, settings] = await Promise.all([getTranslations("settings"), getSettingsOverview()]);
  if (!settings.success) {
    return (
      <>
        <PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.settings" }]} />
        <EmptyState icon={<ShieldAlert className="size-6" />} title={settings.error} />
      </>
    );
  }
  return <><PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.settings" }]} /><div className="flex flex-col gap-4"><SettingsNav /><ShopProfileForm profile={settings.data.profile} /><PrintPrefsForm preferences={settings.data.printPreferences} cashboxOptions={settings.data.cashboxes} /></div></>;
}
