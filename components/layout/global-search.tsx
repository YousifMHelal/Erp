"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/shared/kbd";
import { NAV_GROUPS } from "@/lib/nav";

export function GlobalSearch() {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const flatItems = NAV_GROUPS.flatMap((g) => g.items);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 min-h-11 min-w-11 items-center gap-2 rounded-md border border-input bg-background px-3 text-body-sm text-muted-foreground transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:h-9 sm:w-64"
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="hidden truncate sm:inline">{t("layout.searchPlaceholder")}</span>
        <Kbd className="ms-auto hidden sm:inline-flex">Ctrl K</Kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title={t("layout.searchShortcutHint")}>
        <CommandInput placeholder={t("layout.searchPlaceholder")} />
        <CommandList>
          <CommandEmpty>{t("common.noResults")}</CommandEmpty>
          <CommandGroup heading={t("layout.searchShortcutHint")}>
            {flatItems.map((item) => (
              <CommandItem
                key={item.href}
                value={t(item.labelKey)}
                onSelect={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {t(item.labelKey)}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
