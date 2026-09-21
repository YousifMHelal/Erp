import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { PartyList } from "@/components/shared/party/party-list";
import type { PartyListRow } from "@/types";

const CUSTOMERS: PartyListRow[] = [
  { id: "1", name: "بقالة النور", phone: "01012345678", balance: "4250.00", isActive: true },
  { id: "2", name: "سوبر ماركت الأمانة", phone: "01098765432", balance: "3100.50", isActive: true },
  { id: "3", name: "محمد عبد الرحمن", phone: "01011122233", balance: "0.00", isActive: true },
];

export default function CustomersListPage() {
  const t = useTranslations("parties");

  return (
    <>
      <PageHeader title={t("customersTitle")} breadcrumbs={[{ labelKey: "nav.customers" }]} />
      <PartyList partyType="CUSTOMER" parties={CUSTOMERS} />
    </>
  );
}
