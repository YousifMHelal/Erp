import { notFound } from "next/navigation";
import { getCustomerDetail } from "@/actions/customers.actions";
import { getSupplierDetail } from "@/actions/suppliers.actions";
import { StatementPrintButton } from "@/components/shared/party/statement-print-button";
import { Money } from "@/components/shared/money";
import { formatDate } from "@/lib/format";
import messages from "@/messages/ar.json";
import type { StatementPrintPageProps } from "@/types";

export default async function StatementPrintPage({ params, searchParams }: StatementPrintPageProps) {
  const [{ partyType, id }, { size }] = await Promise.all([params, searchParams]);
  if (partyType !== "customer" && partyType !== "supplier") notFound();
  const result = partyType === "customer" ? await getCustomerDetail(id) : await getSupplierDetail(id);
  if (!result.success) notFound();
  const { party, statement } = result.data;
  const paperSize = size === "A5" ? "A5" : "A4";
  const t = messages.parties.detail;

  return (
    <main id="print-root" className="min-h-dvh bg-background p-4 text-foreground print:p-0">
      <style>{`@media print { @page { size: ${paperSize} portrait; margin: 12mm; } }`}</style>
      <div className={`mx-auto rounded-lg bg-card p-6 shadow-sm print:w-auto print:rounded-none print:p-0 print:shadow-none ${paperSize === "A5" ? "max-w-[148mm]" : "max-w-[210mm]"}`}>
        <div className="mb-6 flex items-start justify-between gap-4 print:mb-4">
          <div>
            <h1 className="text-h1 font-bold">{t.tabStatement}</h1>
            <p className="font-medium">{party.name}</p>
            {party.phone && <p className="tabular-nums" dir="ltr">{party.phone}</p>}
          </div>
          <StatementPrintButton />
        </div>
        <div className="mb-4 flex justify-between border-b border-border pb-3">
          <span>{t.currentBalance}</span>
          <Money value={party.balance} className="font-semibold" />
        </div>
        <table className="w-full border-collapse text-body-sm">
          <thead>
            <tr className="border-b border-border text-start">
              <th className="p-2 text-start">{t.columnDate}</th>
              <th className="p-2 text-start">{t.columnDescription}</th>
              <th className="p-2 text-end">{t.columnDebit}</th>
              <th className="p-2 text-end">{t.columnCredit}</th>
              <th className="p-2 text-end">{t.columnBalanceAfter}</th>
            </tr>
          </thead>
          <tbody>
            {statement.map((line) => (
              <tr key={line.id} className="border-b border-border">
                <td className="p-2 tabular-nums">{formatDate(line.date)}</td>
                <td className="p-2">{line.description}</td>
                <td className="p-2 text-end"><Money value={line.debit} /></td>
                <td className="p-2 text-end"><Money value={line.credit} /></td>
                <td className="p-2 text-end font-medium"><Money value={line.balanceAfter} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
