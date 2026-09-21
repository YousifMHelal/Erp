"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StocktakeSheet } from "@/components/inventory/stocktake/stocktake-sheet";
import { StocktakeDiffSummary } from "@/components/inventory/stocktake/stocktake-diff-summary";
import type { NewStocktakeViewProps, StocktakeLineDraft } from "@/types";

export function NewStocktakeView({ initialLines }: NewStocktakeViewProps) {
  const t = useTranslations("inventory.stocktake");
  const [lines, setLines] = useState<StocktakeLineDraft[]>(initialLines);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function updateCounted(lineId: string, countedQty: number | null) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, countedQty } : l)));
  }

  function handleConfirm() {
    setConfirmOpen(false);
    toast.success(t("confirmSuccess"));
    // P5-9 wires this to the real stocktake.actions.ts confirm action.
  }

  const allCounted = lines.every((l) => l.countedQty !== null);

  return (
    <div className="flex flex-col gap-4">
      <StocktakeDiffSummary lines={lines} />
      <StocktakeSheet lines={lines} onUpdateCounted={updateCounted} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          {t("saveDraft")}
        </Button>
        <Button type="button" variant="accent" disabled={!allCounted} onClick={() => setConfirmOpen(true)}>
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
