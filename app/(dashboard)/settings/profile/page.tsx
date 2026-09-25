import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth-guard";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import type { MyProfile } from "@/types";

export default async function SettingsProfilePage() {
  const [t, user] = await Promise.all([getTranslations("settings"), requireAuth()]);
  const breadcrumbs = [{ labelKey: "nav.settings", href: "/settings" }, { labelKey: "layout.profile" }];

  const profile: MyProfile = {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    avatarUrl: user.avatarUrl ?? undefined,
    avatarColor: user.avatarColor,
    roleName: user.role.name,
  };

  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={breadcrumbs} />
      <div className="flex flex-col gap-4">
        <SettingsNav />
        <div className="flex flex-col gap-6 lg:max-w-2xl">
          <ProfileForm profile={profile} />
          <ChangePasswordForm />
        </div>
      </div>
    </>
  );
}
