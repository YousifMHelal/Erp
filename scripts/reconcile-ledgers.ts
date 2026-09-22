import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const zero = new Prisma.Decimal(0);

async function reconcileCashboxes(): Promise<number> {
  const cashboxes = await prisma.cashbox.findMany();
  for (const cashbox of cashboxes) {
    const ledger = await prisma.cashMovement.aggregate({
      where: { cashboxId: cashbox.id }, _sum: { amount: true },
    });
    const expected = cashbox.openingBalance.plus(ledger._sum.amount ?? zero);
    if (!expected.equals(cashbox.balance)) {
      throw new Error(`Cashbox ${cashbox.name}: stored ${cashbox.balance}, ledger ${expected}`);
    }
  }
  return cashboxes.length;
}

async function reconcileParties(
  partyType: "customer" | "supplier",
): Promise<number> {
  const parties = partyType === "customer"
    ? await prisma.customer.findMany()
    : await prisma.supplier.findMany();
  for (const party of parties) {
    const ledger = await prisma.partyTransaction.aggregate({
      where: partyType === "customer" ? { customerId: party.id } : { supplierId: party.id },
      _sum: { debit: true, credit: true },
    });
    // An OPENING ledger row already contains openingBalance, so adding the column again would double it.
    const expected = (ledger._sum.debit ?? zero).minus(ledger._sum.credit ?? zero);
    if (!expected.equals(party.balance)) {
      throw new Error(`${partyType} ${party.name}: stored ${party.balance}, ledger ${expected}`);
    }
  }
  return parties.length;
}

async function main() {
  const [cashboxes, customers, suppliers] = await Promise.all([
    reconcileCashboxes(), reconcileParties("customer"), reconcileParties("supplier"),
  ]);
  console.log(`Reconciled cashboxes=${cashboxes} customers=${customers} suppliers=${suppliers}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
