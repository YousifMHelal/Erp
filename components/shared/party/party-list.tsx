"use client";

import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableDensityToggle } from "@/components/shared/data-table/data-table-density-toggle";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PartyFormDialog } from "@/components/shared/party/party-form-dialog";
import { PartyMobileCard } from "@/components/shared/party/party-mobile-card";
import { usePartyColumns } from "@/components/shared/party/party-columns";
import type { PartyListRow, PartyListProps } from "@/types";

const PAGE_SIZE = 10;

export function PartyList({ partyType, parties: initialParties }: PartyListProps) {
  const t = useTranslations("parties");
  const [parties, setParties] = useState(initialParties);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<PartyListRow | undefined>(undefined);
  const [deletingParty, setDeletingParty] = useState<PartyListRow | undefined>(undefined);

  function handleEdit(party: PartyListRow) {
    setEditingParty(party);
    setDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) setEditingParty(undefined);
  }

  function handleSave(values: { name: string; phone: string; address: string; openingBalance: string; notes: string }) {
    if (editingParty) {
      setParties((prev) =>
        prev.map((p) => (p.id === editingParty.id ? { ...p, name: values.name, phone: values.phone } : p)),
      );
    } else {
      setParties((prev) => [
        ...prev,
        { id: crypto.randomUUID(), name: values.name, phone: values.phone, balance: values.openingBalance, isActive: true },
      ]);
    }
  }

  function handleDelete(party: PartyListRow) {
    setDeletingParty(party);
  }

  function confirmDelete() {
    if (!deletingParty) return;
    setParties((prev) => prev.filter((p) => p.id !== deletingParty.id));
    toast.success(t("deleteSuccess"));
    setDeletingParty(undefined);
    // P6-1 wires this to the real customers.actions.ts/suppliers.actions.ts,
    // which should block/warn on deleting a party with a non-zero balance or existing transaction history.
  }

  const columns = usePartyColumns(partyType, t, handleEdit, handleDelete);

  const filtered = useMemo(
    () => parties.filter((p) => !search || p.name.includes(search) || (p.phone ?? "").includes(search)),
    [parties, search],
  );

  const pageCount = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const newLabel = partyType === "CUSTOMER" ? t("newCustomer") : t("newSupplier");
  const emptyTitle = partyType === "CUSTOMER" ? t("emptyCustomerTitle") : t("emptySupplierTitle");
  const searchPlaceholder = partyType === "CUSTOMER" ? t("searchCustomerPlaceholder") : t("searchSupplierPlaceholder");

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={paged}
        getRowId={(row) => row.id}
        renderMobileCard={(row) => (
          <PartyMobileCard party={row} partyType={partyType} onEdit={handleEdit} onDelete={handleDelete} />
        )}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        totalCount={filtered.length}
        emptyState={
          <EmptyState
            icon={<Users className="size-6" />}
            title={emptyTitle}
            action={
              <Button variant="primary" onClick={() => setDialogOpen(true)}>
                <Plus /> {newLabel}
              </Button>
            }
          />
        }
        toolbar={
          <DataTableToolbar
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder={searchPlaceholder}
            actions={
              <>
                <DataTableDensityToggle />
                <Button variant="primary" onClick={() => setDialogOpen(true)}>
                  <Plus /> {newLabel}
                </Button>
              </>
            }
          />
        }
      />
      <PartyFormDialog
        partyType={partyType}
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        party={editingParty}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={!!deletingParty}
        onOpenChange={(open) => !open && setDeletingParty(undefined)}
        title={t("deleteTitle", { name: deletingParty?.name ?? "" })}
        description={t("deleteDescription", { name: deletingParty?.name ?? "" })}
        confirmLabel={t("deleteConfirm")}
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
