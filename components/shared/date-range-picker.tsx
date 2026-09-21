"use client";

import { CalendarIcon } from "lucide-react";
import { arEG } from "date-fns/locale";
import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DateRange, DateRangePickerProps } from "@/types";

const WEEK_STARTS_ON = 6; // Saturday, matching the app calendar's ar-EG week convention.

function presetRange(preset: "TODAY" | "THIS_WEEK" | "THIS_MONTH"): DateRange {
  const now = new Date();
  if (preset === "TODAY") return { from: startOfDay(now), to: endOfDay(now) };
  if (preset === "THIS_WEEK") {
    return {
      from: startOfWeek(now, { weekStartsOn: WEEK_STARTS_ON }),
      to: endOfWeek(now, { weekStartsOn: WEEK_STARTS_ON }),
    };
  }
  return { from: startOfMonth(now), to: endOfMonth(now) };
}

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
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border p-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onChange(presetRange("TODAY"))}>
            {t("dateRangePresetToday")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onChange(presetRange("THIS_WEEK"))}>
            {t("dateRangePresetThisWeek")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onChange(presetRange("THIS_MONTH"))}>
            {t("dateRangePresetThisMonth")}
          </Button>
          {(value.from || value.to) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ms-auto"
              onClick={() => onChange({ from: undefined, to: undefined })}
            >
              {t("dateRangeClear")}
            </Button>
          )}
        </div>
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
