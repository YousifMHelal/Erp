import Link from "next/link";
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NotificationListItemProps, NotificationSeverity } from "@/types";

const SEVERITY_ICON: Record<NotificationSeverity, typeof Info> = {
  INFO: Info,
  WARNING: AlertTriangle,
  CRITICAL: OctagonAlert,
};

const SEVERITY_COLOR: Record<NotificationSeverity, string> = {
  INFO: "bg-info-bg text-info-fg",
  WARNING: "bg-warning-bg text-warning-fg",
  CRITICAL: "bg-danger-bg text-danger-fg",
};

export function NotificationListItem({ notification, onMarkRead }: NotificationListItemProps) {
  const t = useTranslations("notifications");
  const Icon = SEVERITY_ICON[notification.severity];

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md p-4 transition-colors duration-200",
        !notification.isRead && "bg-primary/5",
      )}
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", SEVERITY_COLOR[notification.severity])}>
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("text-body-sm", !notification.isRead && "font-semibold")}>{notification.title}</span>
        <span className="text-body-sm text-muted-foreground">{notification.body}</span>
        <span className="text-caption text-muted-foreground">{formatDate(notification.createdAt)}</span>
      </div>
      {!notification.isRead && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            onMarkRead(notification.id);
          }}
        >
          {t("markRead")}
        </Button>
      )}
    </div>
  );

  return notification.entityHref ? <Link href={notification.entityHref}>{content}</Link> : content;
}
