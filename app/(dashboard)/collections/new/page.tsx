import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { MoneyDocumentForm } from "@/components/shared/money-document/money-document-form";
import type { EntityComboboxOption, PartyWithBalanceOption } from "@/types";

const CUSTOMERS: PartyWithBalanceOption[] = [
  { value: "1", label: "بقالة النور", description: "رصيد حالي: 4,250.00 ج.م", balance: "4250.00" },
  { value: "2", label: "سوبر ماركت الأمانة", description: "رصيد حالي: 3,100.50 ج.م", balance: "3100.50" },
];

const CASHBOXES: EntityComboboxOption[] = [
  { value: "1", label: "نقدي" },
  { value: "2", label: "فودافون كاش" },
  { value: "3", label: "إنستاباي" },
];

export default function NewCollectionPage() {
  const t = useTranslations("moneyDocuments.form");

  return (
    <>
      <PageHeader
        title={t("newCollectionTitle")}
        breadcrumbs={[{ labelKey: "nav.collections", href: "/collections" }, { labelKey: "moneyDocuments.form.newCollectionTitle" }]}
      />
      <MoneyDocumentForm documentType="COLLECTION" partyOptions={CUSTOMERS} cashboxOptions={CASHBOXES} />
    </>
  );
}
