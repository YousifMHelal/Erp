import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationList } from "@/components/notifications/notification-list";
import type { NotificationItem } from "@/types";

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    type: "OUT_OF_STOCK",
    severity: "CRITICAL",
    title: "نفد المخزون",
    body: "زيت عافية ١.٥ لتر وصل إلى صفر",
    entityHref: "/inventory/2",
    isRead: false,
    createdAt: "2026-09-21",
  },
  {
    id: "2",
    type: "LOW_STOCK",
    severity: "WARNING",
    title: "مخزون منخفض",
    body: "سكر ٢ كجم وصل إلى ٦ كيس، أقل من الحد الأدنى ١٥",
    entityHref: "/inventory/3",
    isRead: false,
    createdAt: "2026-09-20",
  },
  {
    id: "3",
    type: "CUSTOMER_BALANCE",
    severity: "INFO",
    title: "ارتفاع رصيد عميل",
    body: "رصيد بقالة النور وصل إلى 4,250.00 ج.م",
    entityHref: "/customers/1",
    isRead: true,
    createdAt: "2026-09-19",
  },
];

export default function NotificationsPage() {
  const t = useTranslations("notifications");

  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.notifications" }]} />
      <NotificationList notifications={NOTIFICATIONS} />
    </>
  );
}
