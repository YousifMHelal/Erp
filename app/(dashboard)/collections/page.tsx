import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { MoneyDocumentList } from "@/components/shared/money-document/money-document-list";
import type { MoneyDocumentRow } from "@/types";

const COLLECTIONS: MoneyDocumentRow[] = [
  { id: "1", number: 12, partyName: "بقالة النور", cashboxName: "نقدي", amount: "500.00", status: "CONFIRMED", occurredAt: "2026-09-15" },
  { id: "2", number: 11, partyName: "سوبر ماركت الأمانة", cashboxName: "فودافون كاش", amount: "300.00", status: "CONFIRMED", occurredAt: "2026-08-30" },
];

export default function CollectionsListPage() {
  const t = useTranslations("moneyDocuments.list");

  return (
    <>
      <PageHeader title={t("collectionsTitle")} breadcrumbs={[{ labelKey: "nav.collections" }]} />
      <MoneyDocumentList documentType="COLLECTION" documents={COLLECTIONS} />
    </>
  );
}
