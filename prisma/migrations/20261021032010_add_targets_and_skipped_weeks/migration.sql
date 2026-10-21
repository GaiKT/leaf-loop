-- CreateTable
CREATE TABLE "HarvestTarget" (
    "id" TEXT NOT NULL,
    "varietyId" TEXT NOT NULL,
    "effectiveWeek" DATE NOT NULL,
    "kgPerWeek" DECIMAL(8,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HarvestTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkippedWeek" (
    "id" TEXT NOT NULL,
    "varietyId" TEXT NOT NULL,
    "week" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkippedWeek_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HarvestTarget_varietyId_effectiveWeek_key" ON "HarvestTarget"("varietyId", "effectiveWeek");

-- CreateIndex
CREATE UNIQUE INDEX "SkippedWeek_varietyId_week_key" ON "SkippedWeek"("varietyId", "week");

-- AddForeignKey
ALTER TABLE "HarvestTarget" ADD CONSTRAINT "HarvestTarget_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "Variety"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkippedWeek" ADD CONSTRAINT "SkippedWeek_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "Variety"("id") ON DELETE CASCADE ON UPDATE CASCADE;
