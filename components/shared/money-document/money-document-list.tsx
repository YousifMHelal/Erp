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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MoneyDocumentMobileCard } from "@/components/shared/money-document/money-document-mobile-card";
import { useMoneyDocumentColumns } from "@/components/shared/money-document/money-document-columns";
import { deleteCollection } from "@/actions/collections.actions";
import { deletePayment } from "@/actions/payments.actions";
import type { MoneyDocumentListProps, MoneyDocumentRow } from "@/types";

const PAGE_SIZE = 10;

export function MoneyDocumentList({ documentType, documents }: MoneyDocumentListProps) {
  const t = useTranslations("moneyDocuments.list");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deletingDocument, setDeletingDocument] = useState<MoneyDocumentRow | undefined>(undefined);
  const [pending, setPending] = useState(false);

  function handleEdit(document: MoneyDocumentRow) {
    router.push(documentType === "COLLECTION" ? `/collections/${document.id}/edit` : `/payments/${document.id}/edit`);
  }

  async function confirmDelete() {
    if (!deletingDocument) return;
    setPending(true);
    try {
      const response = documentType === "COLLECTION"
        ? await deleteCollection(deletingDocument.id)
        : await deletePayment(deletingDocument.id);
      if (!response.success) {
        toast.error(response.error);
        return;
      }
      toast.success(documentType === "COLLECTION" ? t("collectionDeleted") : t("paymentDeleted"));
      setDeletingDocument(undefined);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const columns = useMoneyDocumentColumns(documentType, t, handleEdit, setDeletingDocument);
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

  const deleteTitle = documentType === "COLLECTION" ? t("deleteCollectionTitle") : t("deletePaymentTitle");
  const deleteDescription = deletingDocument
    ? t(documentType === "COLLECTION" ? "deleteCollectionDescription" : "deletePaymentDescription", {
        number: String(deletingDocument.number).padStart(5, "0"),
      })
    : "";

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={paged}
        getRowId={(row) => row.id}
        renderMobileCard={(row) => (
          <MoneyDocumentMobileCard document={row} documentType={documentType} onEdit={handleEdit} onDelete={setDeletingDocument} />
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
      <ConfirmDialog
        open={!!deletingDocument}
        onOpenChange={(open) => !open && setDeletingDocument(undefined)}
        title={deleteTitle}
        description={deleteDescription}
        variant="destructive"
        onConfirm={confirmDelete}
        isPending={pending}
      />
    </div>
  );
}
