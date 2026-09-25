import { Prisma } from "@prisma/client";

/** True when a create failed only because another request with the same offline `clientRequestId` won the race. */
export function isClientRequestIdConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  return JSON.stringify(error.meta?.target ?? "").includes("clientRequestId");
}
