import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { MoneyDocumentRowActions } from "@/components/shared/money-document/money-document-row-actions";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MoneyDocumentMobileCardProps } from "@/types";

export function MoneyDocumentMobileCard({ document, documentType, onCancel }: MoneyDocumentMobileCardProps) {
  return (
    <Card className={document.status === "CANCELLED" ? "opacity-60" : undefined}>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={cn("font-medium", document.status === "CANCELLED" && "line-through")}>
            #{String(document.number).padStart(5, "0")}
          </span>
          <div className="flex items-center gap-1">
            <Money value={document.amount} className="font-medium" />
            <MoneyDocumentRowActions documentType={documentType} document={document} onCancel={onCancel} />
          </div>
        </div>
        <span className="text-body-sm text-muted-foreground">{document.partyName}</span>
        <div className="flex items-center justify-between text-caption text-muted-foreground">
          <span>{document.cashboxName}</span>
          <span className="tabular-nums">{formatDate(document.occurredAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
