import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StatCardProps } from "@/types";

export function StatCard({ label, value, delta, icon: Icon, sparkline }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-label text-muted-foreground">{label}</span>
          {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden="true" />}
        </div>
        <span className="text-display tabular-nums">{value}</span>
        {delta && (
          <span
            className={cn(
              "inline-flex w-fit items-center gap-1 text-body-sm font-medium",
              delta.tone === "success" ? "text-success-fg" : "text-danger-fg",
            )}
          >
            {delta.tone === "success" ? (
              <ArrowUp className="size-3.5" aria-hidden="true" />
            ) : (
              <ArrowDown className="size-3.5" aria-hidden="true" />
            )}
            <span className="tabular-nums">{delta.value}</span>
          </span>
        )}
        {sparkline}
      </CardContent>
    </Card>
  );
}
