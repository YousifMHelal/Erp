"use client";

import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function StatementPrintButton() {
  const t = useTranslations("parties.detail");
  return (
    <Button type="button" variant="outline" onClick={() => window.print()} className="print:hidden">
      <Printer /> {t("printStatement")}
    </Button>
  );
}
