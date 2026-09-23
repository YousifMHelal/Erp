"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/shared/app-tooltip";
import type { MoneyDocumentRowActionsProps } from "@/types";

export function MoneyDocumentRowActions({ document, onEdit, onDelete }: MoneyDocumentRowActionsProps) {
  const t = useTranslations("common");

  if (document.status === "CANCELLED") return null;

  return (
    <div className="flex items-center justify-end gap-1">
      <AppTooltip content={t("edit")}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(document);
          }}
          aria-label={t("edit")}
        >
          <Pencil className="size-4" />
        </Button>
      </AppTooltip>
      <AppTooltip content={t("delete")}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(document);
          }}
          aria-label={t("delete")}
          className="text-danger-fg hover:bg-danger-bg"
        >
          <Trash2 className="size-4" />
        </Button>
      </AppTooltip>
    </div>
  );
}
