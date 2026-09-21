"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarBrand } from "@/components/layout/sidebar-brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useUiStore } from "@/stores/ui.store";

export function MobileNav() {
  const t = useTranslations("layout");
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("openNav")}
          className="min-h-11 min-w-11 lg:hidden"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="group/sidebar w-72 bg-sidebar p-0 text-sidebar-foreground" data-expanded="true">
        <SheetHeader className="sr-only">
          <SheetTitle>{t("openNav")}</SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col">
          <SidebarBrand />
          <div className="no-scrollbar flex-1 overflow-y-auto">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
