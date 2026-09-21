import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { MoneyDocumentList } from "@/components/shared/money-document/money-document-list";
import type { MoneyDocumentRow } from "@/types";

const PAYMENTS: MoneyDocumentRow[] = [
  { id: "1", number: 5, partyName: "شركة الدلتا للمواد الغذائية", cashboxName: "نقدي", amount: "4000.00", status: "CONFIRMED", occurredAt: "2026-09-20" },
  { id: "2", number: 4, partyName: "مؤسسة النيل للتوزيع", cashboxName: "نقدي", amount: "500.00", status: "CONFIRMED", occurredAt: "2026-09-19" },
];

export default function PaymentsListPage() {
  const t = useTranslations("moneyDocuments.list");

  return (
    <>
      <PageHeader title={t("paymentsTitle")} breadcrumbs={[{ labelKey: "nav.payments" }]} />
      <MoneyDocumentList documentType="PAYMENT" documents={PAYMENTS} />
    </>
  );
}
