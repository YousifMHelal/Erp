"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/shared/app-tooltip";
import type { PartyRowActionsProps } from "@/types";

export function PartyRowActions({ party, onEdit }: PartyRowActionsProps) {
  const t = useTranslations("common");

  return (
    <div className="flex items-center justify-end gap-1">
      <AppTooltip content={t("edit")}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="max-md:min-h-11 max-md:min-w-11"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(party);
          }}
          aria-label={t("edit")}
        >
          <Pencil className="size-4" />
        </Button>
      </AppTooltip>
    </div>
  );
}
