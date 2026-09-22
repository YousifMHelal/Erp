import { getTranslations } from "next-intl/server";
import { getPayments } from "@/actions/payments.actions";
import { PageHeader } from "@/components/shared/page-header";
import { MoneyDocumentList } from "@/components/shared/money-document/money-document-list";
export default async function PaymentsListPage() {
  const [t, payments] = await Promise.all([getTranslations("moneyDocuments.list"), getPayments()]);

  return (
    <>
      <PageHeader title={t("paymentsTitle")} breadcrumbs={[{ labelKey: "nav.payments" }]} />
      {payments.success ? <MoneyDocumentList documentType="PAYMENT" documents={payments.data} /> : <p role="alert">{payments.error}</p>}
    </>
  );
}
