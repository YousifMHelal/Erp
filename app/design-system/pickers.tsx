"use client";

import * as React from "react";
import { arEG } from "date-fns/locale";
import { CalendarIcon, ClockIcon, ChevronsUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/format";

const SAMPLE_CUSTOMERS = ["أحمد محمود", "سارة عبد الله", "محمد إبراهيم", "منى فتحي"];
const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

export function DatePickerSection() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">منتقي التاريخ</h2>
      <p className="text-body-sm text-muted-foreground">
        نمط مركّب من <code>Popover</code> + <code>Calendar</code> — لا يوجد مكوّن
        `DatePicker` مستقل بعد (يُبنى في P2-3 كـ <code>DateRangePicker</code>).
      </p>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-56 justify-start gap-2">
            <CalendarIcon className="size-4" />
            {date ? formatDate(date) : "اختر تاريخاً"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            locale={arEG}
            className="w-full p-2"
            classNames={{ root: "w-full", months: "w-full gap-2", month: "w-full gap-2" }}
          />
        </PopoverContent>
      </Popover>
    </section>
  );
}

export function DateTimePickerSection() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [hour, setHour] = React.useState("09");
  const [minute, setMinute] = React.useState("30");
  const [period, setPeriod] = React.useState<"ص" | "م">("ص");

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">منتقي التاريخ والوقت</h2>
      <p className="text-body-sm text-muted-foreground">
        لا يوجد مكوّن `DateTimePicker` بعد — هذا تركيب توضيحي من نفس
        اللبنات (<code>Calendar</code> + قوائم ساعة/دقيقة/فترة بدل عنصر
        الوقت الأصلي في المتصفح، الذي لا يتبع رموز التصميم أو الأرقام
        الغربية)، وليس جزءاً من نظام التصميم المعتمد إلى أن يُبنى رسمياً.
        ترتيب الساعة⟶الدقيقة⟶الفترة ثابت من اليسار لليمين، كاتفاقية قراءة
        الساعة العالمية، بصرف النظر عن اتجاه الصفحة.
      </p>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-64 justify-start gap-2">
            <ClockIcon className="size-4" />
            <span className="tabular-nums">
              {date
                ? `${formatDate(date)} — ${hour}:${minute} ${period}`
                : "اختر تاريخاً ووقتاً"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            locale={arEG}
            className="w-full p-2"
            classNames={{ root: "w-full", months: "w-full gap-2", month: "w-full gap-2" }}
          />
          <div
            dir="ltr"
            className="flex items-center justify-center gap-2 border-t border-border p-2"
          >
            <Select value={hour} onValueChange={setHour}>
              <SelectTrigger className="w-18 tabular-nums" aria-label="الساعة">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS_12.map((h) => (
                  <SelectItem key={h} value={h} className="tabular-nums">
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">:</span>
            <Select value={minute} onValueChange={setMinute}>
              <SelectTrigger className="w-18 tabular-nums" aria-label="الدقيقة">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MINUTES.map((m) => (
                  <SelectItem key={m} value={m} className="tabular-nums">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={(value) => setPeriod(value as "ص" | "م")}>
              <SelectTrigger className="w-18" aria-label="الفترة">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ص">ص</SelectItem>
                <SelectItem value="م">م</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
    </section>
  );
}

export function ComboboxSection() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string | undefined>(undefined);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">القائمة القابلة للبحث (Combobox)</h2>
      <p className="text-body-sm text-muted-foreground">
        نمط مركّب من <code>Popover</code> + <code>Command</code> — يصبح
        `EntityCombobox` رسمياً في P2-3.
      </p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-64 justify-between font-normal"
          >
            {value ?? "اختر عميلاً…"}
            <ChevronsUpDownIcon className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <Command>
            <CommandInput placeholder="ابحث بالاسم…" />
            <CommandList>
              <CommandEmpty>لا توجد نتائج</CommandEmpty>
              <CommandGroup>
                {SAMPLE_CUSTOMERS.map((name) => (
                  <CommandItem
                    key={name}
                    data-checked={value === name}
                    onSelect={() => {
                      setValue(name);
                      setOpen(false);
                    }}
                  >
                    {name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </section>
  );
}

export function CheckboxSection() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">مربع الاختيار</h2>
      <div className="flex flex-wrap items-center gap-6">
        <label className="group/field-label flex items-center gap-2">
          <Checkbox />
          <span className="text-body-sm">غير محدد</span>
        </label>
        <label className="group/field-label flex items-center gap-2">
          <Checkbox defaultChecked />
          <span className="text-body-sm">محدد</span>
        </label>
        <label className="group/field-label flex items-center gap-2 opacity-50">
          <Checkbox disabled />
          <span className="text-body-sm">معطل</span>
        </label>
        <label className="group/field-label flex items-center gap-2 opacity-50">
          <Checkbox disabled defaultChecked />
          <span className="text-body-sm">معطل ومحدد</span>
        </label>
        <label className="group/field-label flex items-center gap-2">
          <Checkbox aria-invalid />
          <span className="text-body-sm">حالة خطأ</span>
        </label>
      </div>
    </section>
  );
}
