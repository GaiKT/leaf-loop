-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "varietyId" TEXT NOT NULL,
    "harvestWeek" DATE NOT NULL,
    "sowDate" DATE NOT NULL,
    "sownCount" INTEGER NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "germinationDays" INTEGER NOT NULL,
    "nurseryDays" INTEGER NOT NULL,
    "growOutDays" INTEGER NOT NULL,
    "survivalPercent" INTEGER NOT NULL,
    "gramsPerPlant" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Batch_varietyId_harvestWeek_key" ON "Batch"("varietyId", "harvestWeek");

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "Variety"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
