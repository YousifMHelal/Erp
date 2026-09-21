import { Ban, MessageCircle, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { InvoiceActionsBarProps } from "@/types";

export function InvoiceActionsBar({ invoice, onPrint, onCancel }: InvoiceActionsBarProps) {
  const t = useTranslations("sales.detail");
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
        <Button type="button" variant="destructive" onClick={onCancel} className="ms-auto">
          <Ban /> {t("cancelAction")}
        </Button>
      )}
    </div>
  );
}
