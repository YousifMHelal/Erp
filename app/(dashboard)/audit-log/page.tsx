import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { AuditLogList } from "@/components/audit/audit-log-list";
import type { AuditLogRow } from "@/types";

const ENTRIES: AuditLogRow[] = [
  {
    id: "1",
    userName: "أحمد سعيد",
    action: "product.price.update",
    entityLabel: "أرز أبو كاس ٥ كجم",
    createdAt: "2026-09-15",
    beforeJson: { sellPricePerBase: "1150.00" },
    afterJson: { sellPricePerBase: "1200.00" },
  },
  {
    id: "2",
    userName: "أحمد سعيد",
    action: "sale.cancel",
    entityLabel: "فاتورة #000998",
    createdAt: "2026-08-28",
    beforeJson: { status: "CONFIRMED" },
    afterJson: { status: "CANCELLED", cancelReason: "خطأ في الكمية" },
  },
  {
    id: "3",
    userName: "منى فتحي",
    action: "customer.create",
    entityLabel: "محمد عبد الرحمن",
    createdAt: "2026-08-20",
  },
];

export default function AuditLogPage() {
  const t = useTranslations("auditLog");

  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.auditLog" }]} />
      <AuditLogList entries={ENTRIES} />
    </>
  );
}
