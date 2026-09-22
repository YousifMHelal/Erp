"use client";

import { Ban } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/shared/app-tooltip";
import type { MoneyDocumentRowActionsProps } from "@/types";

export function MoneyDocumentRowActions({ document, onCancel }: MoneyDocumentRowActionsProps) {
  const t = useTranslations("moneyDocuments.list");

  if (document.status === "CANCELLED") return null;

  return (
    <div className="flex items-center justify-end gap-1">
      <AppTooltip content={t("cancelAction")}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            onCancel(document);
          }}
          aria-label={t("cancelAction")}
          className="text-danger-fg hover:bg-danger-bg"
        >
          <Ban className="size-4" />
        </Button>
      </AppTooltip>
    </div>
  );
}
