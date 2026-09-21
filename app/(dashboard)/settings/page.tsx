import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { ShopProfileForm } from "@/components/settings/shop-profile-form";
import { PrintPrefsForm } from "@/components/settings/print-prefs-form";
import type { EntityComboboxOption, PrintPreferences, ShopProfile } from "@/types";

const PROFILE: ShopProfile = {
  name: "طيبة",
  phone: "01000000000",
  address: "شارع الجمهورية، المنصورة",
  taxNote: "",
  invoiceFooter: "شكراً لتعاملكم معنا",
};

const PRINT_PREFS: PrintPreferences = { defaultPrintSize: "A4", defaultCashboxId: "1" };

const CASHBOXES: EntityComboboxOption[] = [
  { value: "1", label: "نقدي" },
  { value: "2", label: "فودافون كاش" },
  { value: "3", label: "إنستاباي" },
];

export default function SettingsPage() {
  const t = useTranslations("settings");

  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={[{ labelKey: "nav.settings" }]} />
      <div className="flex flex-col gap-4">
        <SettingsNav />
        <ShopProfileForm profile={PROFILE} />
        <PrintPrefsForm preferences={PRINT_PREFS} cashboxOptions={CASHBOXES} />
      </div>
    </>
  );
}
