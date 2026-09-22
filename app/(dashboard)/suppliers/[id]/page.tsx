import { getSupplierDetail } from "@/actions/suppliers.actions";
import { PageHeader } from "@/components/shared/page-header";
import { PartyDetailView } from "@/components/shared/party/party-detail-view";
import type { PartyDetailPageProps } from "@/types";

export default async function SupplierDetailPage({ params }: PartyDetailPageProps) {
  const { id } = await params;
  const result = await getSupplierDetail(id);
  if (!result.success) return <p role="alert">{result.error}</p>;

  return (
    <>
      <PageHeader
        title={result.data.party.name}
        breadcrumbs={[{ labelKey: "nav.suppliers", href: "/suppliers" }, { labelKey: "parties.detail.breadcrumb" }]}
      />
      <PartyDetailView partyType="SUPPLIER" {...result.data} />
    </>
  );
}
