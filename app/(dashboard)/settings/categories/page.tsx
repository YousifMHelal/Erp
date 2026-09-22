import { getTranslations } from "next-intl/server";
import { getCategories } from "@/actions/settings.actions";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { CategoriesTable } from "@/components/settings/categories-table";

export default async function SettingsCategoriesPage() {
  const [t, categories] = await Promise.all([getTranslations("settings"), getCategories()]);
  return <><PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }, { labelKey: "settings.nav.categories" }]} /><div className="flex flex-col gap-4"><SettingsNav /><CategoriesTable categories={categories.success ? categories.data : []} /></div></>;
}
