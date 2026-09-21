import Link from "next/link";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import type { TopDebtorsPanelProps } from "@/types";

export function TopDebtorsPanel({ items }: TopDebtorsPanelProps) {
  const t = useTranslations("dashboard");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("topDebtorsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {items.length === 0 ? (
          <EmptyState icon={<Users className="size-6" />} title={t("topDebtorsEmpty")} />
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/customers/${item.id}`}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-2 transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="truncate text-body-sm font-medium">{item.name}</span>
              <Money value={item.balance} className="shrink-0 text-body-sm font-medium text-danger-fg" />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
