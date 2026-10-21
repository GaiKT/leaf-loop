-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "nurseryRemaining" INTEGER;

-- CreateTable
CREATE TABLE "Placement" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "tableId" TEXT,
    "tableName" TEXT NOT NULL,
    "transplantDate" DATE NOT NULL,
    "plantCount" INTEGER NOT NULL,
    "harvestDate" DATE,
    "harvestKg" DECIMAL(8,3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Placement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Placement_batchId_idx" ON "Placement"("batchId");

-- CreateIndex
CREATE INDEX "Placement_tableId_idx" ON "Placement"("tableId");

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;
