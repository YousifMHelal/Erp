import { getTranslations } from "next-intl/server";
import { getCollectionFormOptions } from "@/actions/collections.actions";
import { PageHeader } from "@/components/shared/page-header";
import { MoneyDocumentForm } from "@/components/shared/money-document/money-document-form";

export default async function NewCollectionPage() {
  const [t, options] = await Promise.all([getTranslations("moneyDocuments.form"), getCollectionFormOptions()]);

  return (
    <>
      <PageHeader
        title={t("newCollectionTitle")}
        breadcrumbs={[{ labelKey: "nav.collections", href: "/collections" }, { labelKey: "moneyDocuments.form.newCollectionTitle" }]}
      />
      {options.success ? <MoneyDocumentForm documentType="COLLECTION" partyOptions={options.data.parties} cashboxOptions={options.data.cashboxes} /> : <p role="alert">{options.error}</p>}
    </>
  );
}
