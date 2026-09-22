import { getTranslations } from "next-intl/server";
import { getPaymentFormOptions } from "@/actions/payments.actions";
import { PageHeader } from "@/components/shared/page-header";
import { MoneyDocumentForm } from "@/components/shared/money-document/money-document-form";

export default async function NewPaymentPage() {
  const [t, options] = await Promise.all([getTranslations("moneyDocuments.form"), getPaymentFormOptions()]);

  return (
    <>
      <PageHeader
        title={t("newPaymentTitle")}
        breadcrumbs={[{ labelKey: "nav.payments", href: "/payments" }, { labelKey: "moneyDocuments.form.newPaymentTitle" }]}
      />
      {options.success ? <MoneyDocumentForm documentType="PAYMENT" partyOptions={options.data.parties} cashboxOptions={options.data.cashboxes} /> : <p role="alert">{options.error}</p>}
    </>
  );
}
