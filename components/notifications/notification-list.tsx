"use client";

import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { NotificationListItem } from "@/components/notifications/notification-list-item";
import type { NotificationItem } from "@/types";

export function NotificationList({ notifications: initial }: { notifications: NotificationItem[] }) {
  const t = useTranslations("notifications");
  const [notifications, setNotifications] = useState(initial);

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="flex flex-col gap-4">
      {hasUnread && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" className="max-md:min-h-11" onClick={markAllRead}>
            <CheckCheck /> {t("markAllRead")}
          </Button>
        </div>
      )}
      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="size-6" />} title={t("empty")} />
      ) : (
        <Card className="divide-y divide-border overflow-hidden p-0">
          {notifications.map((notification) => (
            <NotificationListItem
              key={notification.id}
              notification={notification}
              onMarkRead={markRead}
              onDelete={deleteNotification}
            />
          ))}
        </Card>
      )}
    </div>
  );
}
