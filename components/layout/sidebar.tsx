"use client";

import { ChevronsRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SidebarBrand } from "@/components/layout/sidebar-brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { AppTooltip } from "@/components/shared/app-tooltip";
import { useUiStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";
import type { SidebarProps } from "@/types";

export function Sidebar({ className }: SidebarProps) {
  const t = useTranslations("layout");
  const expanded = useUiStore((s) => s.sidebarExpanded);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      data-expanded={expanded}
      className={cn(
        "group/sidebar sticky top-0 z-40 hidden h-dvh shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        expanded ? "w-64" : "w-[72px]",
        className,
      )}
    >
      <div className="relative">
        <SidebarBrand />
        <AppTooltip content={expanded ? t("collapseSidebar") : t("expandSidebar")} side="left">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            aria-label={expanded ? t("collapseSidebar") : t("expandSidebar")}
            className="absolute top-1/2 start-full z-40 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-sidebar-border bg-sidebar text-sidebar-foreground shadow-elevation-sm hover:bg-sidebar-accent/60 hover:text-white"
          >
            <ChevronsRight className={cn("size-3.5 transition-transform duration-200", expanded && "rotate-180")} />
          </Button>
        </AppTooltip>
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto">
        <SidebarNav />
      </div>
    </aside>
  );
}
