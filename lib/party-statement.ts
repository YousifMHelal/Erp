import { decimal } from "@/lib/money";
import messages from "@/messages/ar.json";
import type { PartyStatementEntry, StatementLine } from "@/types";

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
    return {
      id: entry.id,
      date: entry.date,
      description,
      debit: entry.debit,
      credit: entry.credit,
      balanceAfter: balance.toString(),
    };
  });
}
