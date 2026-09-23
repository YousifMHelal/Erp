import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCollectionById, getCollectionFormOptions } from "@/actions/collections.actions";
import { PageHeader } from "@/components/shared/page-header";
import { MoneyDocumentForm } from "@/components/shared/money-document/money-document-form";

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [t, collection] = await Promise.all([getTranslations("moneyDocuments.list"), getCollectionById(id)]);
  if (!collection.success) notFound();

  const options = await getCollectionFormOptions(collection.data.partyId);

  return (
    <>
      <PageHeader
        title={t("editCollectionTitle")}
        breadcrumbs={[{ labelKey: "nav.collections", href: "/collections" }, { labelKey: "moneyDocuments.list.editCollectionTitle" }]}
      />
      {options.success ? (
        <MoneyDocumentForm
          documentType="COLLECTION"
          partyOptions={options.data.parties}
          cashboxOptions={options.data.cashboxes}
          editing={collection.data}
        />
      ) : (
        <p role="alert">{options.error}</p>
      )}
    </>
  );
}
