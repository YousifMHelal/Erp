import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment } from "react";

export function Breadcrumb({ items }: { items: { labelKey: string; href?: string }[] }) {
  const t = useTranslations();

  if (items.length === 0) return null;

  return (
    <nav aria-label={t("layout.brandTagline")} className="hidden items-center gap-1 text-body-sm text-muted-foreground md:flex">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <Fragment key={item.labelKey}>
            {index > 0 && <ChevronLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-foreground hover:underline">
                {t(item.labelKey)}
              </Link>
            ) : (
              <span aria-current={isLast ? "page" : undefined} className={isLast ? "font-medium text-foreground" : ""}>
                {t(item.labelKey)}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
