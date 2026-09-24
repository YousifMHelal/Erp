import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth-guard";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import type { MyProfile } from "@/types";

export default async function ProfilePage() {
  const [t, user] = await Promise.all([getTranslations("profile"), requireAuth()]);
  const breadcrumbs = [{ labelKey: "layout.profile" }];

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
      <PageHeader title={t("title")} description={t("description")} breadcrumbs={breadcrumbs} />
      <div className="flex flex-col gap-6 lg:max-w-2xl">
        <ProfileForm profile={profile} />
        <ChangePasswordForm />
      </div>
    </>
  );
}
