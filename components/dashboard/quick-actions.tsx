import Link from "next/link";
import { FilePlus2, PackagePlus, Warehouse, Wallet, HandCoins, Banknote } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import type { QuickActionItem } from "@/types";

const DEFAULT_ITEMS: QuickActionItem[] = [
  { labelKey: "dashboard.quickActions.newPurchase", href: "/purchases/new", icon: PackagePlus },
  { labelKey: "dashboard.quickActions.newSale", href: "/sales/new", icon: FilePlus2 },
  { labelKey: "dashboard.quickActions.inventory", href: "/inventory", icon: Warehouse },
  { labelKey: "dashboard.quickActions.cashboxes", href: "/cashboxes", icon: Wallet },
  { labelKey: "dashboard.quickActions.collectPayment", href: "/collections/new", icon: HandCoins },
  { labelKey: "dashboard.quickActions.makePayment", href: "/payments/new", icon: Banknote },
];

export function QuickActions() {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {DEFAULT_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href}>
            <Card className="transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <CardContent className="flex flex-col items-center gap-2 text-center">
                <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-body-sm font-medium">{t(item.labelKey)}</span>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
