import { useTranslations } from "next-intl";

export function LoginBrandPanel() {
  const t = useTranslations();

  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-white lg:flex">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-md bg-accent text-h2 font-bold text-accent-foreground">
          ط
        </span>
        <span className="text-h2 font-bold">{t("app.name")}</span>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-display font-bold leading-tight">{t("auth.brandHeadline")}</p>
        <p className="max-w-sm text-body text-white/70">{t("auth.brandSubline")}</p>
      </div>
      <p className="text-caption text-white/50">{t("app.description")}</p>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-24 -top-24 size-72 rounded-full bg-accent/20 blur-3xl"
      />
    </div>
  );
}
