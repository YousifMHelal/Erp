import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { CategoriesTable } from "@/components/settings/categories-table";
import type { CategoryRow } from "@/types";

const CATEGORIES: CategoryRow[] = [
  { id: "1", name: "مواد غذائية", productCount: 24 },
  { id: "2", name: "زيوت", productCount: 6 },
  { id: "3", name: "مشروبات", productCount: 12 },
];

export default function SettingsCategoriesPage() {
  const t = useTranslations("settings");

  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }, { labelKey: "settings.nav.categories" }]} />
      <div className="flex flex-col gap-4">
        <SettingsNav />
        <CategoriesTable categories={CATEGORIES} />
      </div>
    </>
  );
}
