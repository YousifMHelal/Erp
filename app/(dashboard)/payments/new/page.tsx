import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { MoneyDocumentForm } from "@/components/shared/money-document/money-document-form";
import type { EntityComboboxOption, PartyWithBalanceOption } from "@/types";

const SUPPLIERS: PartyWithBalanceOption[] = [
  { value: "1", label: "شركة الدلتا للمواد الغذائية", description: "رصيد حالي: 8,400.00 ج.م", balance: "8400.00" },
  { value: "2", label: "مؤسسة النيل للتوزيع", description: "رصيد حالي: 0.00 ج.م", balance: "0.00" },
];

const CASHBOXES: EntityComboboxOption[] = [
  { value: "1", label: "نقدي" },
  { value: "2", label: "فودافون كاش" },
  { value: "3", label: "إنستاباي" },
];

export default function NewPaymentPage() {
  const t = useTranslations("moneyDocuments.form");

  return (
    <>
      <PageHeader
        title={t("newPaymentTitle")}
        breadcrumbs={[{ labelKey: "nav.payments", href: "/payments" }, { labelKey: "moneyDocuments.form.newPaymentTitle" }]}
      />
      <MoneyDocumentForm documentType="PAYMENT" partyOptions={SUPPLIERS} cashboxOptions={CASHBOXES} />
    </>
  );
}
