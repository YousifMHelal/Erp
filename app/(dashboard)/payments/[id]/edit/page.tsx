import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPaymentById, getPaymentFormOptions } from "@/actions/payments.actions";
import { PageHeader } from "@/components/shared/page-header";
import { MoneyDocumentForm } from "@/components/shared/money-document/money-document-form";

export default async function EditPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [t, payment] = await Promise.all([getTranslations("moneyDocuments.list"), getPaymentById(id)]);
  if (!payment.success) notFound();

  const options = await getPaymentFormOptions(payment.data.partyId);

  return (
    <>
      <PageHeader
        title={t("editPaymentTitle")}
        breadcrumbs={[{ labelKey: "nav.payments", href: "/payments" }, { labelKey: "moneyDocuments.list.editPaymentTitle" }]}
      />
      {options.success ? (
        <MoneyDocumentForm
          documentType="PAYMENT"
          partyOptions={options.data.parties}
          cashboxOptions={options.data.cashboxes}
          editing={payment.data}
        />
      ) : (
        <p role="alert">{options.error}</p>
      )}
    </>
  );
}
