/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "maxReferrals" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referralCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referredByDriverId" TEXT;

-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "pendingRescheduleTime" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Driver_referralCode_key" ON "Driver"("referralCode");

-- CreateIndex
CREATE INDEX "Driver_referralCode_idx" ON "Driver"("referralCode");

-- CreateIndex
CREATE INDEX "Driver_referredByDriverId_idx" ON "Driver"("referredByDriverId");

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_referredByDriverId_fkey" FOREIGN KEY ("referredByDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
