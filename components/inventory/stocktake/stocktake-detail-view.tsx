"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StocktakeSheet } from "@/components/inventory/stocktake/stocktake-sheet";
import { updateStocktake, deleteStocktake } from "@/actions/stocktake.actions";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StocktakeDetail, StocktakeLineDraft } from "@/types";

export function StocktakeDetailView({
  stocktake,
  canEdit,
  canDelete,
}: {
  stocktake: StocktakeDetail;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations("inventory.stocktake");
  const tAction = useTranslations("stocktakeAction");
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [lines, setLines] = useState<StocktakeLineDraft[]>(() => toDrafts(stocktake));
  const [note, setNote] = useState(stocktake.note ?? "");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const invoiceNumber = String(stocktake.number).padStart(4, "0");

  function updateCounted(lineId: string, countedQty: number | null) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, countedQty } : l)));
  }

  function handleSaveEdit() {
    startTransition(async () => {
      const result = await updateStocktake({
        id: stocktake.id,
        note: note.trim() || undefined,
        lines: lines
          .filter((line) => line.countedQty !== null)
          .map((line) => ({ productId: line.productId, countedQty: String(line.countedQty) })),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(tAction("updatedOk", { number: invoiceNumber }));
      setIsEditing(false);
      router.refresh();
    });
  }

  function handleDeleteConfirm() {
    startTransition(async () => {
      const result = await deleteStocktake(stocktake.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(tAction("deletedOk", { number: invoiceNumber }));
      router.push("/inventory/stocktake");
    });
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-4">
        <StocktakeSheet lines={lines} onUpdateCounted={updateCounted} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stocktake-note">{t("noteLabel")}</Label>
          <Textarea id="stocktake-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={() => setIsEditing(false)}>
            {t("editCancel")}
          </Button>
          <Button type="button" variant="accent" disabled={isPending} onClick={handleSaveEdit}>
            {t("editSave")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {(canEdit || canDelete) && (
        <div className="flex justify-end gap-2">
          {canEdit && (
            <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil /> {t("editAction")}
            </Button>
          )}
          {canDelete && (
            <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 /> {t("deleteAction")}
            </Button>
          )}
        </div>
      )}
      {stocktake.note && (
        <Card>
          <CardContent className="text-body-sm text-muted-foreground">
            {t("noteLabel")}: {stocktake.note}
          </CardContent>
        </Card>
      )}
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-label">{t("columnProduct")}</TableHead>
              <TableHead className="text-label">{t("columnUnit")}</TableHead>
              <TableHead className="text-label">{t("columnSystem")}</TableHead>
              <TableHead className="text-label">{t("columnCounted")}</TableHead>
              <TableHead className="text-label text-end">{t("columnDifference")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocktake.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="font-medium">{line.productName}</TableCell>
                <TableCell>{line.unitName}</TableCell>
                <TableCell className="tabular-nums">{formatNumber(line.systemQty)}</TableCell>
                <TableCell className="tabular-nums">{formatNumber(line.countedQty)}</TableCell>
                <TableCell
                  className={cn(
                    "text-end tabular-nums font-medium",
                    line.difference > 0 && "text-success-fg",
                    line.difference < 0 && "text-danger-fg",
                  )}
                >
                  {line.difference > 0 ? "+" : ""}
                  {formatNumber(line.difference)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteDialogTitle", { number: invoiceNumber })}
        description={t("deleteDialogDescription")}
        variant="destructive"
        confirmLabel={t("deleteAction")}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

function toDrafts(stocktake: StocktakeDetail): StocktakeLineDraft[] {
  return stocktake.lines.map((line) => ({
    id: line.id,
    productId: line.productId,
    productName: line.productName,
    unitName: line.unitName,
    baseUnitName: line.baseUnitName,
    subUnitName: line.subUnitName,
    unitsPerBase: line.unitsPerBase,
    unitType: "SUB",
    systemQty: line.systemQty,
    countedQty: line.countedQty,
  }));
}
