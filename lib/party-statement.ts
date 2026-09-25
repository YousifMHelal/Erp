import { decimal } from "@/lib/money";
import messages from "@/messages/ar.json";
import type { PartyStatementEntry, StatementLine } from "@/types";

/**
 * An invoice's ledger row only carries what's still owed (total − paid). For reading, show it the
 * standard statement way — مدين = invoice total, دائن = paid with the invoice — which nets to the
 * same amount, so the running balance is unchanged.
 */
function presentInvoiceRow(entry: PartyStatementEntry): { debit: string; credit: string } {
  if (entry.type !== "INVOICE" || entry.invoiceTotal === undefined || entry.invoicePaid === undefined) {
    return { debit: entry.debit, credit: entry.credit };
  }
  const paid = decimal(entry.invoicePaid);
  const remaining = decimal(entry.invoiceTotal).minus(paid);
  if (paid.isZero() || !decimal(entry.debit).minus(entry.credit).equals(remaining)) {
    return { debit: entry.debit, credit: entry.credit };
  }
  return { debit: entry.invoiceTotal, credit: entry.invoicePaid };
}

export function buildPartyStatement(entries: PartyStatementEntry[]): StatementLine[] {
  let balance = decimal(0);
  return entries.map((entry) => {
    balance = balance.plus(entry.debit).minus(entry.credit);
    const number = entry.invoiceNumber ?? entry.referenceNumber;
    const formattedNumber = number === undefined ? "" : String(number).padStart(6, "0");
    const description = entry.type === "OPENING"
      ? messages.partyStatement.opening
      : entry.type === "RETURN"
        ? messages.partyStatement.return.replace("{number}", formattedNumber)
        : entry.type === "PAYMENT"
          ? (entry.referenceType === "COLLECTION" ? messages.partyStatement.collection : messages.partyStatement.payment).replace("{number}", formattedNumber)
          : entry.invoiceNumber !== undefined
            ? messages.partyStatement.invoice.replace("{number}", formattedNumber)
            : messages.partyStatement.adjustment;
    const isDocumentRow = entry.type === "INVOICE" || entry.type === "RETURN";
    const { debit, credit } = presentInvoiceRow(entry);
    return {
      id: entry.id,
      date: entry.date,
      type: entry.type,
      description,
      debit,
      credit,
      balanceAfter: balance.toString(),
      invoiceId: isDocumentRow ? entry.invoiceId : undefined,
      isReturn: entry.type === "RETURN",
    };
  });
}
