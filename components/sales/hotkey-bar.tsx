import { useTranslations } from "next-intl";
import { Kbd } from "@/components/shared/kbd";
import { cn } from "@/lib/utils";
import type { HotkeyBarProps } from "@/types";

const HINTS = [
  { key: "F2", labelKey: "sales.new.hotkeyProductSearch" },
  { key: "F8", labelKey: "sales.new.hotkeyDeleteLine" },
  { key: "F9", labelKey: "sales.new.hotkeySave" },
  { key: "F10", labelKey: "sales.new.hotkeyNew" },
  { key: "F12", labelKey: "sales.new.hotkeySaveAndNew" },
] as const;

export function HotkeyBar({ className }: HotkeyBarProps) {
  const t = useTranslations();

  return (
    <div className={cn("hidden items-center gap-4 border-t border-border bg-muted/50 px-4 py-2 lg:flex", className)}>
      {HINTS.map((hint) => (
        <span key={hint.key} className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <Kbd>{hint.key}</Kbd>
          {t(hint.labelKey)}
        </span>
      ))}
    </div>
  );
}
