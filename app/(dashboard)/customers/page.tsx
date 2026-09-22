import { getTranslations } from "next-intl/server";
import { getCustomers } from "@/actions/customers.actions";
import { PageHeader } from "@/components/shared/page-header";
import { PartyList } from "@/components/shared/party/party-list";

export default async function CustomersListPage() {
  const [t, customers] = await Promise.all([getTranslations("parties"), getCustomers()]);

  return (
    <>
      <PageHeader title={t("customersTitle")} breadcrumbs={[{ labelKey: "nav.customers" }]} />
      {customers.success ? <PartyList partyType="CUSTOMER" parties={customers.data} /> : <p role="alert">{customers.error}</p>}
    </>
  );
}
