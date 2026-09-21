"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { formatDate } from "@/lib/format";
import type { SalesTrendChartProps } from "@/types";

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  const t = useTranslations("dashboard");
  const summary = t("salesTrendSummary", {
    count: data.length,
    total: formatMoney(String(data.length > 0 ? data[data.length - 1]!.total : 0)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("salesTrendTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div role="img" aria-label={summary} className="h-50 w-full md:h-70 xl:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="salesTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                reversed
                tickFormatter={(value: string) => formatDate(value)}
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
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
                labelFormatter={(value) => formatDate(String(value))}
                formatter={(value) => [formatMoney(String(value)), t("salesTrendTitle")]}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#salesTrendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
