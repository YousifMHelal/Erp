ALTER TABLE "InvoiceLine" ADD COLUMN "isCurrent" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "InvoiceLine_invoiceId_isCurrent_idx" ON "InvoiceLine"("invoiceId", "isCurrent");
