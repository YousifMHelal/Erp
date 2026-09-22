import { getTranslations } from "next-intl/server";
import { getCollections } from "@/actions/collections.actions";
import { PageHeader } from "@/components/shared/page-header";
import { MoneyDocumentList } from "@/components/shared/money-document/money-document-list";
export default async function CollectionsListPage() {
  const [t, collections] = await Promise.all([getTranslations("moneyDocuments.list"), getCollections()]);

  return (
    <>
      <PageHeader title={t("collectionsTitle")} breadcrumbs={[{ labelKey: "nav.collections" }]} />
      {collections.success ? <MoneyDocumentList documentType="COLLECTION" documents={collections.data} /> : <p role="alert">{collections.error}</p>}
    </>
  );
}
