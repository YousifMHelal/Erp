"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StocktakeSheet } from "@/components/inventory/stocktake/stocktake-sheet";
import { StocktakeDiffSummary } from "@/components/inventory/stocktake/stocktake-diff-summary";
import { confirmStocktake } from "@/actions/stocktake.actions";
import type { NewStocktakeViewProps, StocktakeLineDraft } from "@/types";

export function NewStocktakeView({ initialLines }: NewStocktakeViewProps) {
  const t = useTranslations("inventory.stocktake");
  const tAction = useTranslations("stocktakeAction");
  const router = useRouter();
  const [lines, setLines] = useState<StocktakeLineDraft[]>(initialLines);
  const [note, setNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateCounted(lineId: string, countedQty: number | null) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, countedQty } : l)));
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await confirmStocktake({
        note: note.trim() || undefined,
        lines: lines
          .filter((line) => line.countedQty !== null)
          .map((line) => ({ productId: line.productId, countedQty: String(line.countedQty) })),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setConfirmOpen(false);
      toast.success(tAction("confirmedOk", { number: String(result.data.number).padStart(4, "0") }));
      router.push(`/inventory/stocktake/${result.data.id}`);
    });
  }

  const allCounted = lines.every((l) => l.countedQty !== null);

  return (
    <div className="flex flex-col gap-4">
      <StocktakeDiffSummary lines={lines} />
      <StocktakeSheet lines={lines} onUpdateCounted={updateCounted} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stocktake-note">{t("noteLabel")}</Label>
        <Textarea id="stocktake-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="accent" disabled={!allCounted || isPending} onClick={() => setConfirmOpen(true)}>
          {t("confirmStocktake")}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("confirmDialogTitle")}
        description={t("confirmDialogDescription")}
        confirmLabel={t("confirmStocktake")}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
