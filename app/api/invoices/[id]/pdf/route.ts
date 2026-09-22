import { renderToStream } from "@react-pdf/renderer";
import { Readable } from "node:stream";
import {
  AuthRequiredError,
  PermissionDeniedError,
  requirePermission,
} from "@/lib/auth-guard";
import { InvoicePdf } from "@/components/print/invoice-pdf";
import { prisma } from "@/lib/prisma";
import { saleIdSchema } from "@/lib/validations";
import messages from "@/messages/ar.json";
import type { PdfInvoiceData, PdfRouteContext } from "@/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: PdfRouteContext,
): Promise<Response> {
  try {
    await requirePermission("sale.print");
    const { id } = await params;
    const parsed = saleIdSchema.safeParse(id);
    if (!parsed.success) return new Response(null, { status: 404 });
    const [invoice, settings] = await prisma.$transaction([
      prisma.invoice.findFirst({
        where: { id: parsed.data, type: "SALE" },
        include: {
          customer: { select: { name: true, phone: true } },
          cashbox: { select: { name: true } },
          createdBy: { select: { displayName: true } },
          lines: { where: { isCurrent: true }, orderBy: { sortOrder: "asc" } },
        },
      }),
      prisma.setting.findMany({
        where: {
          key: {
            in: [
              "shop.name",
              "shop.phone",
              "shop.address",
              "shop.invoiceFooter",
            ],
          },
        },
      }),
    ]);
    if (!invoice) return new Response(null, { status: 404 });
    const setting = (key: string): string | undefined => {
      const value = settings.find((entry) => entry.key === key)?.value;
      return typeof value === "string" ? value : undefined;
    };
    const data: PdfInvoiceData = {
      number: invoice.number,
      issuedAt: invoice.issuedAt,
      cashierName: invoice.createdBy.displayName,
      cancelled: invoice.status === "CANCELLED",
      shopName: setting("shop.name") ?? messages.app.name,
      shopPhone: setting("shop.phone"),
      shopAddress: setting("shop.address"),
      footer: setting("shop.invoiceFooter"),
      customerName: invoice.customer?.name,
      customerPhone: invoice.customer?.phone ?? undefined,
      cashboxName: invoice.cashbox.name,
      notes: invoice.notes ?? undefined,
      lines: invoice.lines.map((line) => ({
        name: line.productName,
        unit: line.unitName,
        quantity: line.qtyInUnit.toString(),
        price: line.unitPrice.toString(),
        total: line.lineTotal.toString(),
      })),
      subtotal: invoice.subtotal.toString(),
      discount: invoice.discountAmount.toString(),
      total: invoice.total.toString(),
      paid: invoice.paidAmount.toString(),
      remaining: invoice.remainingAmount.toString(),
    };
    const stream = await renderToStream(InvoicePdf({ data }));
    const body = Readable.toWeb(
      stream as Readable,
    ) as ReadableStream<Uint8Array>;
    return new Response(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="sale-${String(invoice.number).padStart(6, "0")}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof AuthRequiredError)
      return new Response(null, { status: 401 });
    if (error instanceof PermissionDeniedError)
      return new Response(null, { status: 403 });
    console.error("Invoice PDF failed", error);
    return new Response(null, { status: 500 });
  }
}
