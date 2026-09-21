"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { MoneyDocumentEditDialog } from "@/components/shared/money-document/money-document-edit-dialog";
import { useMoneyDocumentColumns } from "@/components/shared/money-document/money-document-columns";
import type { MoneyDocumentListProps, MoneyDocumentRow } from "@/types";

const PAGE_SIZE = 10;

export function MoneyDocumentList({ documentType, documents: initialDocuments }: MoneyDocumentListProps) {
  const t = useTranslations("moneyDocuments.list");
  const [documents, setDocuments] = useState(initialDocuments);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingDocument, setEditingDocument] = useState<MoneyDocumentRow | undefined>(undefined);
  const [deletingDocument, setDeletingDocument] = useState<MoneyDocumentRow | undefined>(undefined);

  function handleEdit(document: MoneyDocumentRow) {
    setEditingDocument(document);
  }

  function handleSaveEdit(id: string, amount: string) {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, amount } : d)));
    toast.success(documentType === "COLLECTION" ? t("collectionUpdated") : t("paymentUpdated"));
  }

  function handleDelete(document: MoneyDocumentRow) {
    setDeletingDocument(document);
  }

  function confirmDelete() {
    if (!deletingDocument) return;
    setDocuments((prev) => prev.filter((d) => d.id !== deletingDocument.id));
    toast.success(documentType === "COLLECTION" ? t("collectionDeleted") : t("paymentDeleted"));
    setDeletingDocument(undefined);
  }

  const columns = useMoneyDocumentColumns(documentType, t, handleEdit, handleDelete);
  const newHref = documentType === "COLLECTION" ? "/collections/new" : "/payments/new";
  const newLabel = documentType === "COLLECTION" ? t("newCollection") : t("newPayment");
  const emptyTitle = documentType === "COLLECTION" ? t("emptyCollectionTitle") : t("emptyPaymentTitle");
  const searchPlaceholder = documentType === "COLLECTION" ? t("searchCollectionPlaceholder") : t("searchPaymentPlaceholder");
  const deleteTitle = documentType === "COLLECTION" ? t("deleteCollectionTitle") : t("deletePaymentTitle");
  const deleteDescription = deletingDocument
    ? documentType === "COLLECTION"
      ? t("deleteCollectionDescription", { number: String(deletingDocument.number).padStart(5, "0") })
      : t("deletePaymentDescription", { number: String(deletingDocument.number).padStart(5, "0") })
    : "";

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
          <MoneyDocumentMobileCard document={row} documentType={documentType} onEdit={handleEdit} onDelete={handleDelete} />
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
      <MoneyDocumentEditDialog
        documentType={documentType}
        open={!!editingDocument}
        onOpenChange={(open) => !open && setEditingDocument(undefined)}
        document={editingDocument}
        onSave={handleSaveEdit}
      />
      <ConfirmDialog
        open={!!deletingDocument}
        onOpenChange={(open) => !open && setDeletingDocument(undefined)}
        title={deleteTitle}
        description={deleteDescription}
        confirmLabel={t("deleteAction")}
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
