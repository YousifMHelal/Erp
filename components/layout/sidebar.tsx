"use client";

import { ChevronsRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SidebarBrand } from "@/components/layout/sidebar-brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";
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
        "group/sidebar sticky top-0 hidden h-dvh shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        expanded ? "w-64" : "w-[72px]",
        className,
      )}
    >
      <SidebarBrand />
      <div className="no-scrollbar flex-1 overflow-y-auto">
        <SidebarNav />
      </div>
      <div className="border-t border-sidebar-border p-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={expanded ? t("collapseSidebar") : t("expandSidebar")}
          title={expanded ? t("collapseSidebar") : t("expandSidebar")}
          className="min-h-11 min-w-11 text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white"
        >
          <ChevronsRight className={cn("size-5 transition-transform duration-200", expanded && "rotate-180")} />
        </Button>
      </div>
    </aside>
  );
}
