import { getTranslations } from "next-intl/server";
import { getCashboxOverview } from "@/actions/cashboxes.actions";
import { PageHeader } from "@/components/shared/page-header";
import { CashboxesView } from "@/components/cashboxes/cashboxes-view";

export default async function CashboxesPage() {
  const [t, overview] = await Promise.all([getTranslations("cashboxes"), getCashboxOverview()]);

  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.cashboxes" }]} />
      {overview.success ? <CashboxesView {...overview.data} /> : <p role="alert">{overview.error}</p>}
    </>
  );
}
