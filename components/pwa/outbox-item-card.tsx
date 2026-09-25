"use client";

import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/shared/money";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatTime } from "@/lib/format";
import type { OutboxItemCardProps } from "@/types";

export function OutboxItemCard({ item, onRetry, onDiscard }: OutboxItemCardProps) {
  const t = useTranslations("offline");
  const failed = item.status === "failed";
  const walkIn = item.kind === "sale" ? t("sheet.walkInCustomer") : t("sheet.walkInSupplier");

  return (
    <article className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-elevation-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-body font-medium">{t(`kind.${item.kind}`)}</h3>
        <StatusBadge
          tone={failed ? "danger" : "info"}
          label={t(`status.${item.status}`)}
          icon={item.status === "syncing" ? Loader2 : undefined}
        />
      </div>
      <div className="flex items-center justify-between gap-3 text-body-sm">
        <span className="line-clamp-1 min-w-0 text-muted-foreground">{item.partyName ?? walkIn}</span>
        <Money value={item.amount} className="shrink-0 font-semibold" />
      </div>
      <p className="text-caption text-muted-foreground tabular-nums">
        {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
        {item.attempts > 0 && ` · ${t("sheet.attempts", { count: item.attempts })}`}
      </p>
      {item.error && <p className="rounded-md bg-danger-bg px-2.5 py-1.5 text-body-sm text-danger-fg">{item.error}</p>}
      <div className="flex justify-end gap-2">
        {failed && (
          <Button type="button" variant="outline" className="min-h-11 md:min-h-9" onClick={() => onRetry(item)}>
            <RotateCcw aria-hidden="true" />
            {t("sheet.retry")}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 text-danger-fg hover:text-danger-fg md:min-h-9"
          disabled={item.status === "syncing"}
          onClick={() => onDiscard(item)}
        >
          <Trash2 aria-hidden="true" />
          {t("sheet.discard")}
        </Button>
      </div>
    </article>
  );
}
