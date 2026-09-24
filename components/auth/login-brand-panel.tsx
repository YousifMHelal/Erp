import { useTranslations } from "next-intl";
import { FileText, PackageSearch, Users, BarChart3 } from "lucide-react";

const FEATURES = [
  { icon: FileText, titleKey: "brandFeatureSalesTitle", descriptionKey: "brandFeatureSalesDescription" },
  { icon: PackageSearch, titleKey: "brandFeatureInventoryTitle", descriptionKey: "brandFeatureInventoryDescription" },
  { icon: Users, titleKey: "brandFeaturePartiesTitle", descriptionKey: "brandFeaturePartiesDescription" },
  { icon: BarChart3, titleKey: "brandFeatureReportsTitle", descriptionKey: "brandFeatureReportsDescription" },
] as const;

export function LoginBrandPanel() {
  const t = useTranslations();
  const tAuth = useTranslations("auth");

  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-white lg:flex">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-md bg-accent text-h2 font-bold text-accent-foreground">
          E
        </span>
        <span className="text-h2 font-bold">{t("app.name")}</span>
      </div>

      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <p className="text-display font-bold leading-tight">{tAuth("brandHeadline")}</p>
          <p className="max-w-sm text-body text-white/70">{tAuth("brandSubline")}</p>
        </div>

        <ul className="flex flex-col gap-5">
          {FEATURES.map(({ icon: Icon, titleKey, descriptionKey }) => (
            <li key={titleKey} className="flex items-start gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white/10">
                <Icon className="size-5 text-accent" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-0.5 pt-0.5">
                <p className="text-body font-medium">{tAuth(titleKey)}</p>
                <p className="text-body-sm text-white/60">{tAuth(descriptionKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-caption text-white/50">{t("app.description")}</p>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-24 -top-24 size-72 rounded-full bg-accent/20 blur-3xl"
      />
    </div>
  );
}
