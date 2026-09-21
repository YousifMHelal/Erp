import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { CashboxesView } from "@/components/cashboxes/cashboxes-view";
import type { CashboxSummary, CashMovementRow } from "@/types";

const CASHBOXES: CashboxSummary[] = [
  { id: "1", name: "نقدي", balance: "12450.00" },
  { id: "2", name: "فودافون كاش", balance: "3200.50" },
  { id: "3", name: "إنستاباي", balance: "980.00" },
];

const MOVEMENTS: CashMovementRow[] = [
  { id: "1", cashboxName: "نقدي", type: "SALE_PAYMENT", amount: 600, balanceAfter: "12450.00", partyName: "بقالة النور", refLabel: "فاتورة #001042", createdAt: "2026-09-21" },
  { id: "2", cashboxName: "فودافون كاش", type: "CUSTOMER_COLLECTION", amount: 300, balanceAfter: "3200.50", partyName: "سوبر ماركت الأمانة", refLabel: "تحصيل #12", createdAt: "2026-09-20" },
  { id: "3", cashboxName: "نقدي", type: "PURCHASE_PAYMENT", amount: -4000, balanceAfter: "11850.00", partyName: "شركة الدلتا للمواد الغذائية", refLabel: "فاتورة شراء #000512", createdAt: "2026-09-20" },
  { id: "4", cashboxName: "نقدي", type: "SUPPLIER_PAYMENT", amount: -500, balanceAfter: "15850.00", partyName: "مؤسسة النيل للتوزيع", refLabel: "دفعة #5", createdAt: "2026-09-19" },
];

export default function CashboxesPage() {
  const t = useTranslations("cashboxes");

  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.cashboxes" }]} />
      <CashboxesView cashboxes={CASHBOXES} movements={MOVEMENTS} />
    </>
  );
}
