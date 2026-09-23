"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableDensityToggle } from "@/components/shared/data-table/data-table-density-toggle";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PartyFormDialog } from "@/components/shared/party/party-form-dialog";
import { PartyMobileCard } from "@/components/shared/party/party-mobile-card";
import { usePartyColumns } from "@/components/shared/party/party-columns";
import { decimal } from "@/lib/money";
import { createCustomer, updateCustomer, archiveCustomer } from "@/actions/customers.actions";
import { createSupplier, updateSupplier, archiveSupplier } from "@/actions/suppliers.actions";
import type { PartyFormValues, PartyListRow, PartyListProps, PartyRecord } from "@/types";

const PAGE_SIZE = 25;

export function PartyList({ partyType, parties }: PartyListProps) {
  const t = useTranslations("parties");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<PartyRecord | undefined>(undefined);
  const [deletingParty, setDeletingParty] = useState<PartyListRow | undefined>(undefined);
  const [archiving, setArchiving] = useState(false);

  function handleEdit(party: PartyListRow) {
    setEditingParty(parties.find((candidate) => candidate.id === party.id));
    setDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) setEditingParty(undefined);
  }

  async function handleSave(values: PartyFormValues): Promise<boolean> {
    const response = partyType === "CUSTOMER"
      ? editingParty ? await updateCustomer(editingParty.id, values) : await createCustomer(values)
      : editingParty ? await updateSupplier(editingParty.id, values) : await createSupplier(values);
    if (!response.success) {
      toast.error(response.error);
      return false;
    }
    router.refresh();
    return true;
  }

  function handleDelete(party: PartyListRow) {
    setDeletingParty(party);
  }

  async function confirmDelete() {
    if (!deletingParty) return;
    setArchiving(true);
    try {
      const response = partyType === "CUSTOMER"
        ? await archiveCustomer(deletingParty.id)
        : await archiveSupplier(deletingParty.id);
      if (!response.success) return toast.error(response.error);
      toast.success(t("deleteSuccess"));
      setDeletingParty(undefined);
      router.refresh();
    } finally {
      setArchiving(false);
    }
  }

  const columns = usePartyColumns(partyType, t, handleEdit, handleDelete);

  const filtered = useMemo(
    () => parties.filter((party) => {
      if (!party.isActive) return false;
      if (search && !party.name.includes(search) && !(party.phone ?? "").includes(search)) return false;
      if (balanceFilter === "outstanding") return !decimal(party.balance).isZero();
      if (balanceFilter === "settled") return decimal(party.balance).isZero();
      return true;
    }),
    [parties, search, balanceFilter],
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
            filters={
              <Select value={balanceFilter} onValueChange={(value) => { setBalanceFilter(value); setPage(1); }}>
                <SelectTrigger className="min-w-36 max-md:min-h-11" aria-label={t("balanceFilterLabel")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("balanceFilterAll")}</SelectItem>
                  <SelectItem value="outstanding">{t("balanceFilterOutstanding")}</SelectItem>
                  <SelectItem value="settled">{t("balanceFilterSettled")}</SelectItem>
                </SelectContent>
              </Select>
            }
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
        isPending={archiving}
      />
    </div>
  );
}
