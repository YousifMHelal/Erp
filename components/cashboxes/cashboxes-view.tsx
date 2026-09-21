"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { CashboxSummaryStrip } from "@/components/cashboxes/cashbox-summary-strip";
import { CashMovementTable } from "@/components/cashboxes/cash-movement-table";
import { TransferCashDialog } from "@/components/cashboxes/transfer-cash-dialog";
import { formatMoney } from "@/lib/format";
import type { CashboxesViewProps, CashMovementRow, DateRange } from "@/types";

export function CashboxesView({ cashboxes: initialCashboxes, movements: initialMovements }: CashboxesViewProps) {
  const t = useTranslations("cashboxes");
  const tTransfer = useTranslations("cashboxes.transferDialog");
  const [cashboxes, setCashboxes] = useState(initialCashboxes);
  const [movements, setMovements] = useState(initialMovements);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [transferOpen, setTransferOpen] = useState(false);

  const filteredMovements = useMemo(() => {
    let result = movements;
    if (selectedId) {
      const cashbox = cashboxes.find((c) => c.id === selectedId);
      result = result.filter((m) => m.cashboxName === cashbox?.name);
    }
    if (dateRange.from || dateRange.to) {
      result = result.filter((m) => {
        const movementDate = new Date(m.createdAt);
        if (dateRange.from && movementDate < dateRange.from) return false;
        if (dateRange.to && movementDate > dateRange.to) return false;
        return true;
      });
    }
    return result;
  }, [movements, cashboxes, selectedId, dateRange]);

  function handleTransfer({
    fromCashboxId,
    toCashboxId,
    amount,
  }: {
    fromCashboxId: string;
    toCashboxId: string;
    amount: number;
  }) {
    const fromCashbox = cashboxes.find((c) => c.id === fromCashboxId);
    const toCashbox = cashboxes.find((c) => c.id === toCashboxId);
    if (!fromCashbox || !toCashbox) return;

    const fromBalanceAfter = Number(fromCashbox.balance) - amount;
    const toBalanceAfter = Number(toCashbox.balance) + amount;

    setCashboxes((prev) =>
      prev.map((c) => {
        if (c.id === fromCashboxId) return { ...c, balance: fromBalanceAfter.toFixed(2) };
        if (c.id === toCashboxId) return { ...c, balance: toBalanceAfter.toFixed(2) };
        return c;
      }),
    );

    const now = new Date().toISOString().slice(0, 10);
    const refLabel = tTransfer("refLabel");
    const outMovement: CashMovementRow = {
      id: `transfer-out-${Date.now()}`,
      cashboxName: fromCashbox.name,
      type: "TRANSFER_OUT",
      amount: -amount,
      balanceAfter: fromBalanceAfter.toFixed(2),
      refLabel: `${refLabel} → ${toCashbox.name}`,
      createdAt: now,
    };
    const inMovement: CashMovementRow = {
      id: `transfer-in-${Date.now()}`,
      cashboxName: toCashbox.name,
      type: "TRANSFER_IN",
      amount,
      balanceAfter: toBalanceAfter.toFixed(2),
      refLabel: `${refLabel} ← ${fromCashbox.name}`,
      createdAt: now,
    };
    setMovements((prev) => [inMovement, outMovement, ...prev]);

    toast.success(
      tTransfer("success", { amount: formatMoney(String(amount)), from: fromCashbox.name, to: toCashbox.name }),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DateRangePicker value={dateRange} onChange={setDateRange} className="sm:w-64" />
        <Button type="button" variant="outline" onClick={() => setTransferOpen(true)}>
          <ArrowLeftRight /> {t("transferAction")}
        </Button>
      </div>
      <CashboxSummaryStrip cashboxes={cashboxes} selectedId={selectedId} onSelectCashbox={setSelectedId} />
      <CashMovementTable movements={filteredMovements} />
      <TransferCashDialog open={transferOpen} onOpenChange={setTransferOpen} cashboxes={cashboxes} onConfirm={handleTransfer} />
    </div>
  );
}
