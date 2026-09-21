import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { PartyList } from "@/components/shared/party/party-list";
import type { PartyListRow } from "@/types";

const SUPPLIERS: PartyListRow[] = [
  { id: "1", name: "شركة الدلتا للمواد الغذائية", phone: "01098765432", balance: "8400.00", isActive: true },
  { id: "2", name: "مؤسسة النيل للتوزيع", phone: "01055566677", balance: "0.00", isActive: true },
];

export default function SuppliersListPage() {
  const t = useTranslations("parties");

  return (
    <>
      <PageHeader title={t("suppliersTitle")} breadcrumbs={[{ labelKey: "nav.suppliers" }]} />
      <PartyList partyType="SUPPLIER" parties={SUPPLIERS} />
    </>
  );
}
