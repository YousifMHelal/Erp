"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { PartySummaryCard } from "@/components/shared/party/party-summary-card";
import { CustomerInvoicesTab } from "@/components/shared/party/customer-invoices-tab";
import { CustomerPaymentsTab } from "@/components/shared/party/customer-payments-tab";
import { AccountStatementTab } from "@/components/shared/party/account-statement-tab";
import { StatementPrintDialog } from "@/components/shared/party/statement-print-dialog";
import type { PartyDetailViewProps } from "@/types";

export function PartyDetailView({ partyType, party, invoices, payments, statement }: PartyDetailViewProps) {
  const t = useTranslations("parties.detail");
  const [printOpen, setPrintOpen] = useState(false);

  function handlePrintSelect(size: "A4" | "A5") {
    setPrintOpen(false);
    toast.success(t("printStarted", { size }));
    // P6-3 wires this to the real statement print/PDF generation.
  }

  return (
    <div className="flex flex-col gap-4">
      <PartySummaryCard party={party} partyType={partyType} />
      <Card className="p-0">
        <CardContent className="p-4">
          <Tabs defaultValue="invoices">
            <TabsList>
              <TabsTrigger value="invoices">{t("tabInvoices")}</TabsTrigger>
              <TabsTrigger value="payments">{t("tabPayments")}</TabsTrigger>
              <TabsTrigger value="statement">{t("tabStatement")}</TabsTrigger>
            </TabsList>
            <TabsContent value="invoices" className="pt-4">
              <CustomerInvoicesTab partyType={partyType} invoices={invoices} />
            </TabsContent>
            <TabsContent value="payments" className="pt-4">
              <CustomerPaymentsTab payments={payments} />
            </TabsContent>
            <TabsContent value="statement" className="pt-4">
              <AccountStatementTab statement={statement} onPrint={() => setPrintOpen(true)} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <StatementPrintDialog open={printOpen} onOpenChange={setPrintOpen} onSelect={handlePrintSelect} />
    </div>
  );
}
