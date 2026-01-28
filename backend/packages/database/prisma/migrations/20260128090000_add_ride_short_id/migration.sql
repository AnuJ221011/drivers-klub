-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "shortId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Ride_shortId_key" ON "Ride"("shortId");
