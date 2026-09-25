"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount, formatMoney } from "@/lib/format";
import type { ReportChartProps } from "@/types";

/** Caps bar width so a range with one or two periods doesn't render as a single solid block. */
const MAX_BAR_SIZE = 56;

/** Printed chart size in CSS px: fits inside the framed A4 content width (~189mm ≈ 714px) at ~63mm tall. */
const PRINT_WIDTH = 700;
const PRINT_HEIGHT = 240;

/** `yyyy-MM-dd` → `dd/MM/yyyy`; other labels pass through. */
function formatDayLabel(label: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(label) ? label.split("-").reverse().join("/") : label;
}

export function ReportChart({ title, data }: ReportChartProps) {
  const t = useTranslations("reports");
  const summary = t("chartSummary", { title, count: data.length });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div role="img" aria-label={summary} className="h-60 w-full md:h-70" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" reversed stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                orientation="right"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => formatMoney(String(value))}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13,
                }}
                formatter={(value) => [formatMoney(String(value)), title]}
              />
              <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={MAX_BAR_SIZE} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/** Print-only chart: fixed size (no ResponsiveContainer, so it can't be measured at screen width), grey bars, black ticks. */
export function ReportPrintChart({ title, data }: ReportChartProps) {
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-[1.5mm] text-[15px] font-bold">{title}</h2>
      <div className="border-[1.2px] border-[#8a8a8a] px-[2mm] pt-[2mm]" dir="ltr">
        <BarChart width={PRINT_WIDTH} height={PRINT_HEIGHT} data={data} margin={{ top: 8, right: 4, bottom: 4, left: 4 }}>
          <CartesianGrid stroke="#d9d9d9" vertical={false} />
          <XAxis
            dataKey="label"
            reversed
            stroke="#8a8a8a"
            tick={{ fill: "#000", fontSize: 11 }}
            tickLine={false}
            tickFormatter={formatDayLabel}
          />
          <YAxis
            orientation="right"
            stroke="#8a8a8a"
            tick={{ fill: "#000", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => formatAmount(String(value))}
            width={80}
          />
          <Bar dataKey="value" fill="#6e6e6e" maxBarSize={MAX_BAR_SIZE} isAnimationActive={false} />
        </BarChart>
      </div>
    </section>
  );
}
