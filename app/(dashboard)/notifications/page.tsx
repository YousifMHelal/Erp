import { getTranslations } from "next-intl/server";
import { getNotifications } from "@/actions/notifications.actions";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationList } from "@/components/notifications/notification-list";

export default async function NotificationsPage() {
  const [t, notifications] = await Promise.all([
    getTranslations("notifications"),
    getNotifications(),
  ]);
  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.notifications" }]} />
      <NotificationList notifications={notifications.success ? notifications.data : []} />
    </>
  );
}
