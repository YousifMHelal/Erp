import { getCustomerDetail } from "@/actions/customers.actions";
import { PageHeader } from "@/components/shared/page-header";
import { PartyDetailView } from "@/components/shared/party/party-detail-view";
import type { PartyDetailPageProps } from "@/types";

export default async function CustomerDetailPage({ params }: PartyDetailPageProps) {
  const { id } = await params;
  const result = await getCustomerDetail(id);
  if (!result.success) return <p role="alert">{result.error}</p>;

  return (
    <>
      <PageHeader
        title={result.data.party.name}
        breadcrumbs={[{ labelKey: "nav.customers", href: "/customers" }, { labelKey: "parties.detail.breadcrumb" }]}
      />
      <PartyDetailView partyType="CUSTOMER" {...result.data} />
    </>
  );
}
