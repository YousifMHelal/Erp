"use client";

import { useMemo, useState } from "react";
import { CashboxSummaryStrip } from "@/components/cashboxes/cashbox-summary-strip";
import { CashMovementTable } from "@/components/cashboxes/cash-movement-table";
import type { CashboxesViewProps } from "@/types";

export function CashboxesView({ cashboxes, movements }: CashboxesViewProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const filteredMovements = useMemo(() => {
    if (!selectedId) return movements;
    const cashbox = cashboxes.find((c) => c.id === selectedId);
    return movements.filter((m) => m.cashboxName === cashbox?.name);
  }, [movements, cashboxes, selectedId]);

  return (
    <div className="flex flex-col gap-4">
      <CashboxSummaryStrip cashboxes={cashboxes} selectedId={selectedId} onSelectCashbox={setSelectedId} />
      <CashMovementTable movements={filteredMovements} />
    </div>
  );
}
