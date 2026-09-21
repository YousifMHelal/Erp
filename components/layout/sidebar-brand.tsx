import Link from "next/link";
import { useTranslations } from "next-intl";

export function SidebarBrand() {
  const t = useTranslations();

  return (
    <Link
      href="/"
      className="flex h-15 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-h3 font-bold text-accent-foreground">
        ط
      </span>
      <span className="flex flex-col overflow-hidden group-data-[expanded=false]/sidebar:sr-only">
        <span className="truncate text-h3 font-bold text-white">{t("app.name")}</span>
        <span className="truncate text-caption text-sidebar-foreground/70">{t("layout.brandTagline")}</span>
      </span>
    </Link>
  );
}
