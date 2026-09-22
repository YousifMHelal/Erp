"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HandCoins, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableDensityToggle } from "@/components/shared/data-table/data-table-density-toggle";
import { EmptyState } from "@/components/shared/empty-state";
import { CancelMoneyDocumentDialog } from "@/components/shared/money-document/cancel-money-document-dialog";
import { MoneyDocumentMobileCard } from "@/components/shared/money-document/money-document-mobile-card";
import { useMoneyDocumentColumns } from "@/components/shared/money-document/money-document-columns";
import { cancelCollection } from "@/actions/collections.actions";
import { cancelPayment } from "@/actions/payments.actions";
import type { MoneyDocumentListProps, MoneyDocumentRow } from "@/types";

const PAGE_SIZE = 10;

export function MoneyDocumentList({ documentType, documents }: MoneyDocumentListProps) {
  const t = useTranslations("moneyDocuments.list");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [cancellingDocument, setCancellingDocument] = useState<MoneyDocumentRow | undefined>(undefined);
  const [pending, setPending] = useState(false);

  async function confirmCancel(reason: string) {
    if (!cancellingDocument) return;
    setPending(true);
    try {
      const response = documentType === "COLLECTION"
        ? await cancelCollection({ id: cancellingDocument.id, reason })
        : await cancelPayment({ id: cancellingDocument.id, reason });
      if (!response.success) {
        toast.error(response.error);
        return;
      }
      toast.success(t("cancelSuccess"));
      setCancellingDocument(undefined);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const columns = useMoneyDocumentColumns(documentType, t, setCancellingDocument);
  const newHref = documentType === "COLLECTION" ? "/collections/new" : "/payments/new";
  const newLabel = documentType === "COLLECTION" ? t("newCollection") : t("newPayment");
  const emptyTitle = documentType === "COLLECTION" ? t("emptyCollectionTitle") : t("emptyPaymentTitle");
  const searchPlaceholder = documentType === "COLLECTION" ? t("searchCollectionPlaceholder") : t("searchPaymentPlaceholder");
  const filtered = useMemo(
    () => documents.filter((d) => !search || d.partyName.includes(search) || String(d.number).includes(search)),
    [documents, search],
  );

  const pageCount = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={paged}
        getRowId={(row) => row.id}
        renderMobileCard={(row) => (
          <MoneyDocumentMobileCard document={row} documentType={documentType} onCancel={setCancellingDocument} />
        )}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        totalCount={filtered.length}
        emptyState={
          <EmptyState
            icon={<HandCoins className="size-6" />}
            title={emptyTitle}
            action={
              <Button asChild variant="primary">
                <Link href={newHref}>
                  <Plus /> {newLabel}
                </Link>
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
                <Button asChild variant="primary">
                  <Link href={newHref}>
                    <Plus /> {newLabel}
                  </Link>
                </Button>
              </>
            }
          />
        }
      />
      <CancelMoneyDocumentDialog documentType={documentType} document={cancellingDocument}
        onOpenChange={(open) => !open && setCancellingDocument(undefined)} onConfirm={confirmCancel} isPending={pending} />
    </div>
  );
}
