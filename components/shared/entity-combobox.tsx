"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { EntityComboboxProps } from "@/types";

export function EntityCombobox({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled,
  className,
}: EntityComboboxProps) {
  const t = useTranslations("shared");
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full min-w-0 justify-between font-normal", className)}
        >
          <span className="min-w-0 truncate">{selected ? selected.label : (placeholder ?? t("comboboxPlaceholder"))}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) gap-0 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder ?? t("comboboxSearchPlaceholder")} />
          <CommandList>
            <CommandEmpty>{emptyMessage ?? t("comboboxEmpty")}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  data-checked={option.value === value}
                  onSelect={() => {
                    onChange(option.value === value ? undefined : option.value);
                    setOpen(false);
                  }}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {option.description && (
                      <span className="shrink-0 whitespace-nowrap text-caption text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
