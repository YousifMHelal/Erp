import Link from "next/link";
import {
  BadgePercent,
  Banknote,
  HandCoins,
  PackageSearch,
  ShoppingCart,
  Truck,
  Users,
  Building2,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import type { ReportKey, ReportPickerItem } from "@/types";

const REPORTS: ReportPickerItem[] = [
  { key: "sales", icon: ShoppingCart },
  { key: "purchases", icon: Truck },
  { key: "inventory", icon: PackageSearch },
  { key: "customers", icon: Users },
  { key: "suppliers", icon: Building2 },
  { key: "cashboxes", icon: Wallet },
  { key: "collections", icon: HandCoins },
  { key: "payments", icon: Banknote },
  { key: "profit-loss", icon: BadgePercent },
];

export function ReportPicker() {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {REPORTS.map((report) => {
        const Icon = report.icon;
        return (
          <Link key={report.key} href={`/reports/${report.key}`}>
            <Card className="h-full transition-colors duration-200 hover:bg-muted">
              <CardContent className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col">
                  <span className="font-medium">{t(reportTitleKey(report.key))}</span>
                  <span className="text-body-sm text-muted-foreground">{t(reportDescriptionKey(report.key))}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export function reportTitleKey(key: ReportKey) {
  return `reports.types.${key}.title` as const;
}

export function reportDescriptionKey(key: ReportKey) {
  return `reports.types.${key}.description` as const;
}
