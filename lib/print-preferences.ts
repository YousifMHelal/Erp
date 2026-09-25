import { prisma } from "@/lib/prisma";

export async function getDefaultPrintSize(): Promise<"A4" | "A5" | "80mm"> {
  const setting = await prisma.setting.findUnique({ where: { key: "print.defaultSize" } });
  return setting?.value === "A4" || setting?.value === "A5" || setting?.value === "80mm" ? setting.value : "A4";
}

/** Statements only come in page sizes, so an 80mm receipt default falls back to A4. */
export async function getDefaultStatementPrintSize(): Promise<"A4" | "A5"> {
  return (await getDefaultPrintSize()) === "A5" ? "A5" : "A4";
}
