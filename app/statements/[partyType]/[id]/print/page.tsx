import { notFound } from "next/navigation";
import { getCustomerDetail } from "@/actions/customers.actions";
import { getSupplierDetail } from "@/actions/suppliers.actions";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { StatementPrintLayout } from "@/components/print/statement-print-layout";
import { prisma } from "@/lib/prisma";
import { resolvePrintTemplateLayout } from "@/lib/print-template";
import { applyStatementFilters, parseStatementFilters } from "@/lib/statement-filters";
import messages from "@/messages/ar.json";
import type { StatementPrintPageProps, StatementPrintShop } from "@/types";

async function loadShopInfo(): Promise<StatementPrintShop> {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ["shop.name", "shop.phone", "shop.phone2", "shop.address"] } },
  });
  const setting = (key: string): string | undefined => {
    const value = settings.find((entry) => entry.key === key)?.value;
    return typeof value === "string" && value ? value : undefined;
  };
  return {
    name: setting("shop.name") ?? messages.app.name,
    phone: setting("shop.phone"),
    phone2: setting("shop.phone2"),
    address: setting("shop.address"),
  };
}

export default async function StatementPrintPage({ params, searchParams }: StatementPrintPageProps) {
  const [{ partyType, id }, query] = await Promise.all([params, searchParams]);
  if (partyType !== "customer" && partyType !== "supplier") notFound();
  const [result, shop, template] = await Promise.all([
    partyType === "customer" ? getCustomerDetail(id) : getSupplierDetail(id),
    loadShopInfo(),
    resolvePrintTemplateLayout(),
  ]);
  if (!result.success) notFound();
  const { party, statement } = result.data;
  const paperSize = query.size === "A5" ? "A5" : "A4";
  const filters = parseStatementFilters(query);

  return (
    <div id="print-root" className="min-h-dvh bg-neutral-200 py-8 print:py-0">
      <style>{`@media print { @page { size: ${paperSize} portrait; margin: 8mm 0; } }`}</style>
      <PrintToolbar targetId="print-document" fileName={`statement-${partyType}-${party.id}.png`} />
      <div id="print-document" className="mx-auto w-fit">
        <StatementPrintLayout
          size={paperSize}
          title={messages.parties.detail.tabStatement}
          partyLabel={partyType === "customer" ? messages.invoices.party.SALE : messages.invoices.party.PURCHASE}
          party={party}
          statement={applyStatementFilters(statement, filters)}
          printedAt={new Date().toISOString()}
          period={{ from: filters.from, to: filters.to }}
          shop={{ ...shop, logoDataUrl: template.logoDataUrl }}
          infoColumns={template.infoColumns}
        />
      </div>
    </div>
  );
}
