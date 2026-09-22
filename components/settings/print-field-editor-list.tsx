"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/shared/app-tooltip";
import { PrintFieldFormDialog } from "@/components/settings/print-field-form-dialog";
import type { PrintFieldEditorListProps, PrintFieldItem, PrintSystemFieldOption } from "@/types";

export function PrintFieldEditorList({
  column,
  items,
  systemFieldOptions,
  onAddSystemField,
  onAddCustomField,
  onEditSystemField,
  onEditCustomField,
  onRemove,
  onMove,
}: PrintFieldEditorListProps) {
  const t = useTranslations("settings.printTemplate");
  const tCommon = useTranslations("common");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PrintFieldItem | undefined>(undefined);

  function openAddDialog() {
    setEditingItem(undefined);
    setDialogOpen(true);
  }

  function openEditDialog(item: PrintFieldItem) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <FieldRow
            key={item.id}
            item={item}
            systemFieldOptions={systemFieldOptions}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            onEdit={() => openEditDialog(item)}
            onRemove={() => onRemove(column, item.id)}
            onMove={(direction) => onMove(column, item.id, direction)}
          />
        ))}
        {items.length === 0 && <li className="text-body-sm text-muted-foreground">{tCommon("noResults")}</li>}
      </ul>

      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={openAddDialog}>
        <Plus className="size-4" />
        {t("addField")}
      </Button>

      <PrintFieldFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        systemFieldOptions={systemFieldOptions}
        editingItem={editingItem}
        onAddSystemField={(fieldKey, label) => onAddSystemField(column, fieldKey, label)}
        onAddCustomField={(label, value) => onAddCustomField(column, label, value)}
        onEditSystemField={(fieldKey, label) => {
          if (editingItem) onEditSystemField(column, editingItem.id, fieldKey, label);
        }}
        onEditCustomField={(label, value) => {
          if (editingItem) onEditCustomField(column, editingItem.id, label, value);
        }}
      />
    </div>
  );
}

function FieldRow({
  item,
  systemFieldOptions,
  isFirst,
  isLast,
  onEdit,
  onRemove,
  onMove,
}: {
  item: PrintFieldItem;
  systemFieldOptions: PrintSystemFieldOption[];
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
}) {
  const t = useTranslations("settings.printTemplate");
  const tGlobal = useTranslations();

  const source = item.source;
  const sourceDescription =
    source.kind === "custom" ? source.value : tGlobal(systemFieldOptions.find((o) => o.key === source.fieldKey)?.labelKey ?? "");

  const hasLabel = item.label.trim().length > 0;
  const primaryText = hasLabel ? item.label : sourceDescription;

  return (
    <li className="flex items-center gap-2 rounded-sm border border-border bg-card p-3">
      <button
        type="button"
        onClick={onEdit}
        className="flex flex-1 flex-col items-start gap-0.5 text-start"
      >
        <span className="text-body-sm font-medium text-foreground">{primaryText}</span>
        {hasLabel && <span className="text-caption text-muted-foreground">{sourceDescription}</span>}
      </button>
      <div className="flex items-center gap-1">
        <AppTooltip content={t("editField")}>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} aria-label={t("editField")}>
            <Pencil className="size-4" />
          </Button>
        </AppTooltip>
        <AppTooltip content={t("moveUp")}>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onMove("up")} disabled={isFirst} aria-label={t("moveUp")}>
            <ChevronUp className="size-4" />
          </Button>
        </AppTooltip>
        <AppTooltip content={t("moveDown")}>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onMove("down")} disabled={isLast} aria-label={t("moveDown")}>
            <ChevronDown className="size-4" />
          </Button>
        </AppTooltip>
        <AppTooltip content={t("removeField")}>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label={t("removeField")}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </AppTooltip>
      </div>
    </li>
  );
}
