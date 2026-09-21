import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function Home() {
  const t = useTranslations("app");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-4 py-12 text-center">
      <h1 className="text-3xl font-bold text-primary">{t("name")}</h1>
      <p className="text-muted-foreground">{t("foundationReady")}</p>
      <div className="flex justify-center">
        <ThemeToggle />
      </div>
    </main>
  );
}
