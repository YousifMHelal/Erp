import { Ban, MessageCircle, Pencil, Printer, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { InvoiceActionsBarProps } from "@/types";

export function InvoiceActionsBar({ invoice, onPrint, onCancel, onEdit, onDelete }: InvoiceActionsBarProps) {
  const t = useTranslations("invoices.detail");
  const isCancelled = invoice.status === "CANCELLED";
  const whatsappText = encodeURIComponent(
    t("whatsappMessage", { number: String(invoice.number).padStart(6, "0"), total: invoice.total }),
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" onClick={onPrint}>
        <Printer /> {t("printAction")}
      </Button>
      <Button asChild variant="outline">
        <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle /> {t("shareAction")}
        </a>
      </Button>
      {!isCancelled && (
        <div className="ms-auto flex items-center gap-2">
          {onEdit && (
            <Button type="button" variant="outline" onClick={onEdit}>
              <Pencil /> {t("editAction")}
            </Button>
          )}
          {onDelete && (
            <Button type="button" variant="destructive" onClick={onDelete}>
              <Trash2 /> {t("deleteAction")}
            </Button>
          )}
          <Button type="button" variant="destructive" onClick={onCancel}>
            <Ban /> {t("cancelAction")}
          </Button>
        </div>
      )}
    </div>
  );
}
