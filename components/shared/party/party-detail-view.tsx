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
import { updateCustomer } from "@/actions/customers.actions";
import { updateSupplier } from "@/actions/suppliers.actions";
import { captureUrlPng, copyUrlImage, downloadBlob, printUrl } from "@/lib/print-invoice";
import { DEFAULT_STATEMENT_FILTERS, statementFilterParams } from "@/lib/statement-filters";
import type { PartyDetailViewProps, PartyFormValues, StatementFilters } from "@/types";

export function PartyDetailView({ partyType, party, invoices, payments, statement, statementPrintSize }: PartyDetailViewProps) {
  const t = useTranslations("parties.detail");
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [statementFilters, setStatementFilters] = useState<StatementFilters>(DEFAULT_STATEMENT_FILTERS);
  // The print page re-applies the same filters, so print/copy match the on-screen statement.
  const printParams = statementFilterParams(statementFilters);
  printParams.set("size", statementPrintSize);
  const statementPrintUrl = `/statements/${partyType.toLowerCase()}/${party.id}/print?${printParams.toString()}`;

  async function handleCopyImage() {
    setIsCopyingImage(true);
    try {
      await copyUrlImage(statementPrintUrl);
      toast.success(t("statementImageCopied"));
    } catch (cause) {
      console.error("Statement image copy failed", cause);
      try {
        downloadBlob(await captureUrlPng(statementPrintUrl), `statement-${partyType.toLowerCase()}-${party.id}.png`);
        toast.info(t("statementImageDownloadedInstead"));
      } catch (error) {
        console.error("Statement image render failed", error);
        toast.error(t("statementImageFailed"));
      }
    } finally {
      setIsCopyingImage(false);
    }
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
              <AccountStatementTab
                partyType={partyType}
                statement={statement}
                filters={statementFilters}
                onFiltersChange={setStatementFilters}
                onPrint={() => void printUrl(statementPrintUrl)}
                onCopyImage={handleCopyImage}
                isCopyingImage={isCopyingImage}
              />
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
