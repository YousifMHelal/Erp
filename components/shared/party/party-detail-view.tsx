"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { PartySummaryCard } from "@/components/shared/party/party-summary-card";
import { PartyFormDialog } from "@/components/shared/party/party-form-dialog";
import { CustomerInvoicesTab } from "@/components/shared/party/customer-invoices-tab";
import { CustomerPaymentsTab } from "@/components/shared/party/customer-payments-tab";
import { AccountStatementTab } from "@/components/shared/party/account-statement-tab";
import { StatementPrintDialog } from "@/components/shared/party/statement-print-dialog";
import { updateCustomer } from "@/actions/customers.actions";
import { updateSupplier } from "@/actions/suppliers.actions";
import type { PartyDetailViewProps, PartyFormValues } from "@/types";

export function PartyDetailView({ partyType, party, invoices, payments, statement }: PartyDetailViewProps) {
  const t = useTranslations("parties.detail");
  const router = useRouter();
  const [printOpen, setPrintOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  function handlePrintSelect(size: "A4" | "A5") {
    setPrintOpen(false);
    window.open(`/statements/${partyType.toLowerCase()}/${party.id}/print?size=${size}`, "_blank", "noopener,noreferrer");
  }

  async function handleSave(values: PartyFormValues): Promise<boolean> {
    const response = partyType === "CUSTOMER"
      ? await updateCustomer(party.id, values)
      : await updateSupplier(party.id, values);
    if (!response.success) {
      toast.error(response.error);
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <div className="flex flex-col gap-4">
      <PartySummaryCard
        party={party}
        partyType={partyType}
        onEdit={() => setEditOpen(true)}
      />
      <Card className="p-0">
        <CardContent className="p-4">
          <Tabs defaultValue="statement">
            <TabsList>
              <TabsTrigger value="statement">{t("tabStatement")}</TabsTrigger>
              <TabsTrigger value="invoices">{t("tabInvoices")}</TabsTrigger>
              <TabsTrigger value="payments">{t("tabPayments")}</TabsTrigger>
            </TabsList>
            <TabsContent value="statement" className="pt-4">
              <AccountStatementTab partyType={partyType} statement={statement} onPrint={() => setPrintOpen(true)} />
            </TabsContent>
            <TabsContent value="invoices" className="pt-4">
              <CustomerInvoicesTab partyType={partyType} invoices={invoices} />
            </TabsContent>
            <TabsContent value="payments" className="pt-4">
              <CustomerPaymentsTab payments={payments} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <StatementPrintDialog open={printOpen} onOpenChange={setPrintOpen} onSelect={handlePrintSelect} />
      <PartyFormDialog
        partyType={partyType}
        open={editOpen}
        onOpenChange={setEditOpen}
        party={party}
        onSave={handleSave}
      />
    </div>
  );
}
