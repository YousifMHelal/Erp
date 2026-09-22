"use client";

import { Archive, MoreHorizontal, Pencil } from "lucide-react";
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
  const tParties = useTranslations("parties");

  return (
    <DropdownMenu>
      <AppTooltip content={t("actions")}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 max-md:min-h-11 max-md:min-w-11"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
      </AppTooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(party)}>
          <Pencil /> {t("edit")}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(party)}>
          <Archive /> {tParties("archive")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
