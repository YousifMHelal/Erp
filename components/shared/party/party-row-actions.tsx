"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppTooltip } from "@/components/shared/app-tooltip";
import type { PartyRowActionsProps } from "@/types";

export function PartyRowActions({ party, onEdit, onDelete }: PartyRowActionsProps) {
  const t = useTranslations("common");

  return (
    <DropdownMenu>
      <AppTooltip content={t("actions")}>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="size-8" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
      </AppTooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(party)}>
          <Pencil /> {t("edit")}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(party)}>
          <Trash2 /> {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
