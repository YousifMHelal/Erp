"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeftRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { CashboxSummaryStrip } from "@/components/cashboxes/cashbox-summary-strip";
import { CashMovementTable } from "@/components/cashboxes/cash-movement-table";
import { TransferCashDialog } from "@/components/cashboxes/transfer-cash-dialog";
import { transferCash } from "@/actions/cashboxes.actions";
import { formatMoney } from "@/lib/format";
import type { CashboxesViewProps, DateRange } from "@/types";

export function CashboxesView({ cashboxes, movements }: CashboxesViewProps) {
  const t = useTranslations("cashboxes");
  const tTransfer = useTranslations("cashboxes.transferDialog");
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [transferOpen, setTransferOpen] = useState(false);

  const filteredMovements = useMemo(() => {
    let result = movements;
    if (selectedId) {
      result = result.filter((movement) => movement.cashboxId === selectedId);
    }
    if (dateRange.from || dateRange.to) {
      result = result.filter((m) => {
        const movementDate = new Date(m.createdAt);
        if (dateRange.from && movementDate < dateRange.from) return false;
        if (dateRange.to && movementDate >= new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate() + 1)) return false;
        return true;
      });
    }
    return result;
  }, [movements, selectedId, dateRange]);

  async function handleTransfer({
    fromCashboxId,
    toCashboxId,
    amount,
  }: {
    fromCashboxId: string;
    toCashboxId: string;
    amount: string;
  }): Promise<boolean> {
    const fromCashbox = cashboxes.find((c) => c.id === fromCashboxId);
    const toCashbox = cashboxes.find((c) => c.id === toCashboxId);
    if (!fromCashbox || !toCashbox) return false;
    const response = await transferCash({ fromCashboxId, toCashboxId, amount });
    if (!response.success) {
      toast.error(response.error);
      return false;
    }
    toast.success(
      tTransfer("success", { amount: formatMoney(amount), from: fromCashbox.name, to: toCashbox.name }),
    );
    router.refresh();
    return true;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DateRangePicker value={dateRange} onChange={setDateRange} className="sm:w-64" />
        <div className="flex items-center gap-3">
          <Link
            href="/settings/cashboxes"
            className="inline-flex items-center gap-1 text-body-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("createCashbox")}
          </Link>
          <Button type="button" variant="outline" onClick={() => setTransferOpen(true)}>
            <ArrowLeftRight /> {t("transferAction")}
          </Button>
        </div>
      </div>
      <CashboxSummaryStrip cashboxes={cashboxes} selectedId={selectedId} onSelectCashbox={setSelectedId} />
      <CashMovementTable movements={filteredMovements} />
      <TransferCashDialog open={transferOpen} onOpenChange={setTransferOpen} cashboxes={cashboxes} onConfirm={handleTransfer} />
    </div>
  );
}
