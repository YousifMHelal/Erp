import type { Prisma } from "@prisma/client";

export async function nextDocumentNumber(
  tx: Prisma.TransactionClient,
  type: string,
): Promise<number> {
  const counter = await tx.documentCounter.upsert({
    where: { type },
    create: { type, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return counter.lastNumber;
}
