"use client";

import { CalendarIcon } from "lucide-react";
import { arEG } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DateRangePickerProps } from "@/types";

export function DateRangePicker({ value, onChange, placeholder, className }: DateRangePickerProps) {
  const t = useTranslations("shared");

  const label =
    value.from && value.to
      ? `${formatDate(value.from)} – ${formatDate(value.to)}`
      : value.from
        ? formatDate(value.from)
        : (placeholder ?? t("dateRangePlaceholder"));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start gap-2 sm:w-64", className)}>
          <CalendarIcon className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate tabular-nums">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{ from: value.from, to: value.to }}
          onSelect={(range) => onChange({ from: range?.from, to: range?.to })}
          locale={arEG}
          numberOfMonths={2}
          className="p-2"
        />
      </PopoverContent>
    </Popover>
  );
}
