import { getTranslations } from "next-intl/server";
import { getAuditLog } from "@/actions/audit.actions";
import { PageHeader } from "@/components/shared/page-header";
import { AuditLogList } from "@/components/audit/audit-log-list";
import { AuditLogFiltersBar } from "@/components/audit/audit-log-filters";
import type { AuditLogFilters } from "@/types";

export default async function AuditLogPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const filters: AuditLogFilters = Object.fromEntries(
    Object.entries(query).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
  const [t, audit] = await Promise.all([getTranslations("auditLog"), getAuditLog(filters)]);
  const data = audit.success ? audit.data : { entries: [], users: [], actions: [], entityTypes: [], page: 1, pageCount: 1, totalCount: 0 };
  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.auditLog" }]} />
      <AuditLogFiltersBar filters={filters} users={data.users} actions={data.actions} entityTypes={data.entityTypes} />
      <AuditLogList entries={data.entries} page={data.page} pageCount={data.pageCount} totalCount={data.totalCount} />
    </>
  );
}
