-- AlterTable
ALTER TABLE "Collection" ADD COLUMN "clientRequestId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "clientRequestId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "clientRequestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Collection_clientRequestId_key" ON "Collection"("clientRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_clientRequestId_key" ON "Invoice"("clientRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_clientRequestId_key" ON "Payment"("clientRequestId");
