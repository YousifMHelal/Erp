"use client";

import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableDensityToggle } from "@/components/shared/data-table/data-table-density-toggle";
import { EmptyState } from "@/components/shared/empty-state";
import { PartyFormDialog } from "@/components/shared/party/party-form-dialog";
import { PartyMobileCard } from "@/components/shared/party/party-mobile-card";
import { usePartyColumns } from "@/components/shared/party/party-columns";
import type { PartyListProps } from "@/types";

const PAGE_SIZE = 10;

export function PartyList({ partyType, parties }: PartyListProps) {
  const t = useTranslations("parties");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  const columns = usePartyColumns(partyType, t);

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
        renderMobileCard={(row) => <PartyMobileCard party={row} partyType={partyType} />}
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
      <PartyFormDialog partyType={partyType} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
