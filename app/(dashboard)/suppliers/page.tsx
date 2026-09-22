import { getTranslations } from "next-intl/server";
import { getSuppliers } from "@/actions/suppliers.actions";
import { PageHeader } from "@/components/shared/page-header";
import { PartyList } from "@/components/shared/party/party-list";

export default async function SuppliersListPage() {
  const [t, suppliers] = await Promise.all([getTranslations("parties"), getSuppliers()]);

  return (
    <>
      <PageHeader title={t("suppliersTitle")} breadcrumbs={[{ labelKey: "nav.suppliers" }]} />
      {suppliers.success ? <PartyList partyType="SUPPLIER" parties={suppliers.data} /> : <p role="alert">{suppliers.error}</p>}
    </>
  );
}
