import Link from "next/link";
import { AlertTriangle, Check, Info, OctagonAlert, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/shared/app-tooltip";
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

export function NotificationListItem({ notification, onMarkRead, onDelete }: NotificationListItemProps) {
  const t = useTranslations("notifications");
  const Icon = SEVERITY_ICON[notification.severity];

  const content = (
    <div
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 transition-colors duration-200",
        !notification.isRead && "bg-primary/5",
      )}
    >
      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", SEVERITY_COLOR[notification.severity])}>
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0 sm:flex-row sm:items-baseline sm:gap-2">
        <span className={cn("shrink-0 text-body-sm", !notification.isRead && "font-semibold")}>{notification.title}</span>
        <span className="min-w-0 flex-1 truncate text-body-sm text-muted-foreground">{notification.body}</span>
        <span className="shrink-0 text-caption text-muted-foreground">{formatDate(notification.createdAt)}</span>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {!notification.isRead && (
          <AppTooltip content={t("markRead")}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("markRead")}
              className="max-md:min-h-11 max-md:min-w-11"
              onClick={(e) => {
                e.preventDefault();
                onMarkRead(notification.id);
              }}
            >
              <Check className="size-4" />
            </Button>
          </AppTooltip>
        )}
        <AppTooltip content={t("delete")}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("delete")}
            className="text-danger-fg max-md:min-h-11 max-md:min-w-11 hover:text-danger-fg"
            onClick={(e) => {
              e.preventDefault();
              onDelete(notification.id);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </AppTooltip>
      </div>
    </div>
  );

  return notification.entityHref ? <Link href={notification.entityHref}>{content}</Link> : content;
}
